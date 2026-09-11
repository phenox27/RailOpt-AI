import { NextRequest, NextResponse } from 'next/server'
import { plans, blocks } from '@/data/simulated-data'

function generateSimplePDF(data: {
  planName: string
  planType: string
  startDate: string
  endDate: string
  status: string
  version: number
  blocks: Array<{
    name: string
    section: string
    department: string
    startTime: string
    endTime: string
    duration: number
    isAiRecommended: boolean
  }>
}): Buffer {
  const lines: string[] = []

  lines.push('RailOpt AI - Block Planning Report')
  lines.push('='.repeat(40))
  lines.push('')
  lines.push(`Plan: ${data.planName}`)
  lines.push(`Type: ${data.planType}`)
  lines.push(`Period: ${data.startDate} to ${data.endDate}`)
  lines.push(`Status: ${data.status}`)
  lines.push(`Version: ${data.version}`)
  lines.push(`Generated: ${new Date().toLocaleString('en-IN')}`)
  lines.push('')
  lines.push('BLOCKS')
  lines.push('-'.repeat(40))

  data.blocks.forEach((block, i) => {
    lines.push(`${i + 1}. ${block.name}`)
    lines.push(`   Section: ${block.section} | Dept: ${block.department}`)
    lines.push(`   Time: ${new Date(block.startTime).toLocaleString('en-IN')} - ${new Date(block.endTime).toLocaleString('en-IN')}`)
    lines.push(`   Duration: ${block.duration} min ${block.isAiRecommended ? '[AI Recommended]' : '[Manual]'}`)
    lines.push('')
  })

  lines.push('-'.repeat(40))
  lines.push(`Total Blocks: ${data.blocks.length}`)
  lines.push(`AI Recommended: ${data.blocks.filter(b => b.isAiRecommended).length}`)
  lines.push(`Total Duration: ${Math.round(data.blocks.reduce((s, b) => s + b.duration, 0) / 60)}h`)
  lines.push('')
  lines.push('CONFIDENTIAL - For Internal Use Only')
  lines.push('Indian Railways - RailOpt AI System')

  const text = lines.join('\n')
  const pdfContent = buildMinimalPDF(text)
  return Buffer.from(pdfContent)
}

function buildMinimalPDF(text: string): Uint8Array {
  const encoder = new TextEncoder()

  const objects: string[] = []
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj')
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj')
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj')

  // Content stream - split text into lines and position them
  const textLines = text.split('\n')
  let contentStream = 'BT\n/F1 10 Tf\n'
  let y = 770
  for (const line of textLines) {
    if (y < 50) break // Prevent overflow
    // Escape special PDF characters: backslash, parentheses
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    contentStream += `1 0 0 1 50 ${y} Tm\n(${escaped}) Tj\n`
    y -= 14
  }
  contentStream += 'ET'

  objects.push(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj`)
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj')

  // Build the PDF
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []

  for (const obj of objects) {
    offsets.push(pdf.length)
    pdf += obj + '\n'
  }

  const xrefOffset = pdf.length
  pdf += 'xref\n'
  pdf += `0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`
  }
  pdf += 'trailer\n'
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdf += 'startxref\n'
  pdf += `${xrefOffset}\n`
  pdf += '%%EOF'

  return encoder.encode(pdf)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const planId = searchParams.get('planId')

  const plan = plans.find(p => p.id === planId) || plans[0]
  const planBlocks = blocks.filter(b => plan.blockIds.includes(b.id))

  const pdfBuffer = generateSimplePDF({
    planName: plan.name,
    planType: plan.type,
    startDate: plan.startDate,
    endDate: plan.endDate,
    status: plan.status,
    version: plan.version,
    blocks: planBlocks.map(b => ({
      name: b.name,
      section: b.section,
      department: b.department,
      startTime: b.startTime,
      endTime: b.endTime,
      duration: b.duration,
      isAiRecommended: b.isAiRecommended,
    })),
  })

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="plan-${plan.id}-${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  })
}
