'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { SimMaintenanceRequest } from '@/data/simulated-data'

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  department: z.enum(['engineering', 'snt', 'traction'], { required_error: 'Department is required' }),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(2, 'Category is required'),
  section: z.string().min(2, 'Section is required'),
  stationFrom: z.string().min(2, 'Station From is required'),
  stationTo: z.string().min(2, 'Station To is required'),
  severity: z.enum(['low', 'medium', 'high', 'critical'], { required_error: 'Severity is required' }),
  safetyRisk: z.enum(['low', 'medium', 'high', 'critical'], { required_error: 'Safety Risk is required' }),
  assetCriticality: z.enum(['low', 'medium', 'high', 'critical'], { required_error: 'Asset Criticality is required' }),
  trafficImpact: z.enum(['low', 'medium', 'high', 'critical'], { required_error: 'Traffic Impact is required' }),
  duration: z.coerce.number().min(15, 'Duration must be at least 15 minutes').max(720, 'Duration cannot exceed 12 hours'),
  requestedDate: z.string().min(1, 'Requested date is required'),
})

type FormValues = z.infer<typeof formSchema>

interface CreateRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (request: SimMaintenanceRequest) => void
}

const SECTIONS = ['NDLS-GZB', 'TDL-MTJ', 'CNB-LKO', 'ALD-MGS', 'BPL-JHS', 'NDLS-AGC']
const STATIONS = ['New Delhi', 'Ghaziabad', 'Tundla', 'Mathura', 'Kanpur', 'Lucknow', 'Prayagraj', 'Mughal Sarai', 'Bhopal', 'Jhansi', 'Agra']
const CATEGORIES = ['Track Renewal', 'Track Maintenance', 'Signal Upgradation', 'Point Machine', 'OHE Maintenance', 'OHE Structure', 'TRD Maintenance', 'Bridge Inspection', 'Cable Replacement', 'Turnout Renewal', 'Insulator Replacement', 'AWS Calibration']
const LEVELS = ['low', 'medium', 'high', 'critical'] as const

export function CreateRequestDialog({ open, onOpenChange, onSubmit }: CreateRequestDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      department: 'engineering',
      description: '',
      category: '',
      section: '',
      stationFrom: '',
      stationTo: '',
      severity: 'medium',
      safetyRisk: 'medium',
      assetCriticality: 'medium',
      trafficImpact: 'medium',
      duration: 120,
      requestedDate: new Date().toISOString().split('T')[0],
    },
  })

  const handleSubmit = (values: FormValues) => {
    const newRequest: SimMaintenanceRequest = {
      id: `mr-${Date.now()}`,
      ...values,
      priority: 0,
      isOverdue: false,
      status: 'pending',
      createdBy: 'current-user',
    }
    onSubmit(newRequest)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Maintenance Request</DialogTitle>
          <DialogDescription>
            Enter the details for the new maintenance request. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl><Input placeholder="e.g., Track renewal between NDLS-GZB" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Department + Category row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="snt">Signal & Telecom</SelectItem>
                        <SelectItem value="traction">Traction Distribution</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl><Textarea placeholder="Describe the maintenance requirement..." className="min-h-[80px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Section */}
            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select section" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SECTIONS.map((sec) => (
                        <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Station From/To */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="stationFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Station From *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATIONS.map((st) => (
                          <SelectItem key={st} value={st}>{st}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stationTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Station To *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATIONS.map((st) => (
                          <SelectItem key={st} value={st}>{st}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Severity + Risk Factors */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEVELS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="safetyRisk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Safety Risk *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEVELS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="assetCriticality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Criticality *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEVELS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="trafficImpact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Traffic Impact *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEVELS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Duration + Date */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes) *</FormLabel>
                    <FormControl><Input type="number" placeholder="120" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requestedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested Date *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
