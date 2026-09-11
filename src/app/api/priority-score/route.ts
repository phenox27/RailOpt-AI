import { db } from '@/lib/db'
import { callLLM } from '@/lib/llm'
import { NextRequest, NextResponse } from 'next/server'

interface PriorityFactors {
  severity: string
  isOverdue: boolean
  safetyRisk: string
  assetCriticality: string
  trafficImpact: string
}

/**
 * Calculate a heuristic priority score from factors.
 * Used as fallback when LLM is unavailable.
 */
function calculateHeuristicScore(factors: PriorityFactors): { score: number; breakdown: Record<string, number> } {
  const severityScores: Record<string, number> = { low: 10, medium: 25, high: 40, critical: 55 }
  const riskScores: Record<string, number> = { low: 5, medium: 15, high: 25, critical: 35 }
  const criticalityScores: Record<string, number> = { low: 5, medium: 12, high: 20, critical: 30 }
  const impactScores: Record<string, number> = { low: 3, medium: 8, high: 15, critical: 25 }

  const breakdown = {
    severity: severityScores[factors.severity] || 25,
    overdue: factors.isOverdue ? 15 : 0,
    safetyRisk: riskScores[factors.safetyRisk] || 15,
    assetCriticality: criticalityScores[factors.assetCriticality] || 12,
    trafficImpact: impactScores[factors.trafficImpact] || 8,
  }

  const score = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0))
  return { score, breakdown }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.requestId) {
      return NextResponse.json(
        { error: 'Missing required field: requestId' },
        { status: 400 }
      )
    }

    // Fetch the maintenance request
    const mr = await db.maintenanceRequest.findUnique({
      where: { id: body.requestId },
      include: {
        creator: { select: { id: true, name: true, department: true } },
      },
    })

    if (!mr) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      )
    }

    const factors: PriorityFactors = {
      severity: mr.severity,
      isOverdue: mr.isOverdue,
      safetyRisk: mr.safetyRisk,
      assetCriticality: mr.assetCriticality,
      trafficImpact: mr.trafficImpact,
    }

    // Try to get AI-powered explanation via LLM
    let explanation = ''
    let score = 0
    let breakdown: Record<string, number> = {}

    try {
      const systemPrompt = `You are RailOpt AI, an expert priority scoring engine for Indian Railways maintenance requests.
You analyze factors and provide a priority score (0-100) with a clear explanation.
Always respond in JSON format with: { "score": number, "explanation": string, "breakdown": { "severity": number, "overdue": number, "safetyRisk": number, "assetCriticality": number, "trafficImpact": number } }
The breakdown values should be the individual contribution of each factor to the total score.
Keep explanations concise (2-3 sentences max).`

      const userPrompt = `Score this maintenance request:
Title: ${mr.title}
Department: ${mr.department}
Category: ${mr.category || 'N/A'}
Section: ${mr.section || 'N/A'}
Severity: ${mr.severity}
Overdue: ${mr.isOverdue ? 'Yes' : 'No'}
Safety Risk: ${mr.safetyRisk}
Asset Criticality: ${mr.assetCriticality}
Traffic Impact: ${mr.trafficImpact}
Duration: ${mr.duration} minutes
Requested Date: ${mr.requestedDate?.toISOString() || 'N/A'}
Description: ${mr.description || 'N/A'}`

      const llmResponse = await callLLM(userPrompt, systemPrompt)

      // Parse the LLM response
      try {
        // Try to extract JSON from the response (it may be wrapped in markdown code blocks)
        const jsonMatch = llmResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          score = Math.min(100, Math.max(0, parsed.score || 0))
          explanation = parsed.explanation || ''
          breakdown = parsed.breakdown || {}
        }
      } catch {
        // LLM didn't return valid JSON, use heuristic
      }

      if (!score) {
        const heuristic = calculateHeuristicScore(factors)
        score = heuristic.score
        breakdown = heuristic.breakdown
        explanation = `Heuristic score calculated. ${llmResponse.slice(0, 200)}`
      }
    } catch (llmError) {
      // LLM unavailable, fall back to heuristic
      console.error('LLM unavailable, using heuristic:', llmError)
      const heuristic = calculateHeuristicScore(factors)
      score = heuristic.score
      breakdown = heuristic.breakdown
      explanation = `Priority score based on heuristic calculation. Severity: ${mr.severity}, Overdue: ${mr.isOverdue}, Safety: ${mr.safetyRisk}, Criticality: ${mr.assetCriticality}, Traffic: ${mr.trafficImpact}.`
    }

    // Update the maintenance request with the new score
    await db.maintenanceRequest.update({
      where: { id: mr.id },
      data: {
        priority: score,
        status: mr.status === 'pending' ? 'scored' : mr.status,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'PRIORITY_SCORED',
        entityType: 'request',
        entityId: mr.id,
        userId: body.scoredBy || mr.createdBy,
        userName: 'AI Engine',
        details: `Priority scored: ${score}/100. Factors: severity=${mr.severity}, overdue=${mr.isOverdue}, safetyRisk=${mr.safetyRisk}, assetCriticality=${mr.assetCriticality}, trafficImpact=${mr.trafficImpact}`,
        requestId: mr.id,
      },
    })

    return NextResponse.json({
      data: {
        requestId: mr.id,
        score,
        breakdown,
        explanation,
        factors,
      },
    })
  } catch (error) {
    console.error('Priority score POST error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate priority score', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
