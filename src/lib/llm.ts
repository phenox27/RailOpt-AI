import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

/**
 * Call the z-ai-web-dev-sdk LLM chat completion.
 * Returns the assistant's text response.
 */
export async function callLLM(prompt: string, systemPrompt?: string): Promise<string> {
  const args: string[] = ['chat', '--prompt', prompt]
  if (systemPrompt) {
    args.push('--system', systemPrompt)
  }

  try {
    const { stdout } = await execFileAsync('z-ai', args, {
      timeout: 120000,
      maxBuffer: 1024 * 1024,
    })

    // The SDK outputs JSON after some initialization lines (emoji lines).
    // Find the JSON object in stdout by looking for the first '{'
    const output = stdout.trim()
    const jsonStart = output.indexOf('{')
    if (jsonStart >= 0) {
      const jsonStr = output.slice(jsonStart)
      try {
        const parsed = JSON.parse(jsonStr)
        if (parsed.choices?.[0]?.message?.content) return parsed.choices[0].message.content
        if (parsed.content) return parsed.content
        return JSON.stringify(parsed)
      } catch {
        // JSON parse failed, return raw text
      }
    }
    // Fallback: return the output as-is
    return output
  } catch (error) {
    console.error('LLM call error:', error)
    throw new Error(`LLM call failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Call the z-ai-web-dev-sdk LLM with streaming support via SSE.
 * Returns a ReadableStream for use in Response objects.
 */
export function callLLMStream(prompt: string, systemPrompt?: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        // For streaming, we call the SDK with --stream flag
        const args: string[] = ['chat', '--prompt', prompt, '--stream']
        if (systemPrompt) {
          args.push('--system', systemPrompt)
        }

        const { spawn } = await import('child_process')
        const child = spawn('z-ai', args, {
          stdio: ['pipe', 'pipe', 'pipe'],
        })

        let buffer = ''

        child.stdout.on('data', (data: Buffer) => {
          buffer += data.toString()
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim()) {
              controller.enqueue(encoder.encode(`data: ${line}\n\n`))
            }
          }
        })

        child.stderr.on('data', (data: Buffer) => {
          console.error('LLM stream stderr:', data.toString())
        })

        child.on('close', () => {
          if (buffer.trim()) {
            controller.enqueue(encoder.encode(`data: ${buffer}\n\n`))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        })

        child.on('error', (err) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`))
          controller.close()
        })
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream initialization failed' })}\n\n`))
        controller.close()
      }
    },
  })
}
