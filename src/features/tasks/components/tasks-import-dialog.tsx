import { useState, type FormEvent } from 'react'
import type { TaskPriority, TaskStatus, TaskValues } from '../data/schema'
import { taskPriorities, taskStatuses } from '../data/schema'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type TasksImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (tasks: TaskValues[]) => Promise<void>
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        cell += character
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true
    } else if (character === ',') {
      row.push(cell.trim())
      cell = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(cell.trim())
      if (row.some((value) => value.length > 0)) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }

  if (quoted) throw new Error('The CSV file contains an unclosed quoted field.')
  row.push(cell.trim())
  if (row.some((value) => value.length > 0)) rows.push(row)
  return rows
}

function readTasksCsv(text: string): TaskValues[] {
  const [headerRow, ...rows] = parseCsv(text)
  const headers = headerRow?.map((value, index) =>
    (index === 0 ? value.replace(/^\uFEFF/, '') : value).toLowerCase()
  )

  if (!headers?.includes('title')) {
    throw new Error('CSV must include a title column.')
  }

  const column = (name: string) => headers.indexOf(name)
  const importedTasks = rows.map((row, index) => {
    const status = (row[column('status')] || 'todo').toLowerCase()
    const priority = (row[column('priority')] || 'medium').toLowerCase()
    const title = row[column('title')]?.trim()
    const dueDate = row[column('due_date')]?.trim()
    const assigneeId = row[column('assignee_id')]?.trim()

    if (!title) throw new Error(`Row ${index + 2} is missing a title.`)
    if (title.length > 200) {
      throw new Error(`Row ${index + 2} title exceeds 200 characters.`)
    }
    if (!taskStatuses.includes(status as TaskStatus)) {
      throw new Error(`Row ${index + 2} has an invalid status.`)
    }
    if (!taskPriorities.includes(priority as TaskPriority)) {
      throw new Error(`Row ${index + 2} has an invalid priority.`)
    }
    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      throw new Error(`Row ${index + 2} needs a due_date in YYYY-MM-DD format.`)
    }
    if (!assigneeId) {
      throw new Error(`Row ${index + 2} is missing an assignee_id.`)
    }

    return {
      title,
      status: status as TaskStatus,
      priority: priority as TaskPriority,
      assigneeId,
      dueDate,
    }
  })

  if (importedTasks.length === 0) {
    throw new Error('CSV must contain at least one task.')
  }

  return importedTasks
}

export function TasksImportDialog({
  open,
  onOpenChange,
  onImport,
}: TasksImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError('Choose a CSV file to import.')
      return
    }

    try {
      const importedTasks = readTasksCsv(await file.text())
      await onImport(importedTasks)
      setFile(null)
      setError('')
      onOpenChange(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to import CSV.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value)
        if (!value) {
          setFile(null)
          setError('')
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import tasks</DialogTitle>
          <DialogDescription>
            Include title, assignee_id, and due_date columns. Status and
            priority are optional and default to Todo and Medium.
          </DialogDescription>
        </DialogHeader>
        <form id="tasks-import-form" onSubmit={handleSubmit} className="space-y-2">
          <Input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              setError('')
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="tasks-import-form">
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
