import { useState } from 'react'
import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TasksMutateDrawer } from './components/tasks-mutate-drawer'
import { TasksImportDialog } from './components/tasks-import-dialog'
import { TasksTable } from './components/tasks-table'
import type { Task } from './data/schema'
import { initialTasks } from './data/tasks'

type TaskValues = Omit<Task, 'id'>

export function Tasks() {
  const [tasks, setTasks] = useState(initialTasks)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [tasksToDelete, setTasksToDelete] = useState<string[] | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)

  function openCreateDrawer() {
    setCurrentTask(null)
    setIsDrawerOpen(true)
  }

  function openEditDrawer(task: Task) {
    setCurrentTask(task)
    setIsDrawerOpen(true)
  }

  function saveTask(values: TaskValues) {
    if (currentTask) {
      setTasks((current) =>
        current.map((task) =>
          task.id === currentTask.id ? { ...task, ...values } : task
        )
      )
      return
    }

    setTasks((current) => [
      {
        id: `TASK-${Date.now().toString().slice(-6)}`,
        ...values,
      },
      ...current,
    ])
  }

  function deleteTasks(ids: string[]) {
    setTasks((current) => current.filter((task) => !ids.includes(task.id)))
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Organize and track tasks across your workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="h-9 gap-2 rounded-md px-3 text-sm"
          >
            <Download className="h-4 w-4" />
            Import
          </Button>
          <Button
            onClick={openCreateDrawer}
            className="h-9 gap-2 rounded-md px-3 text-sm"
          >
            <Plus className="h-4 w-4" />
            Create task
          </Button>
        </div>
      </div>

      <TasksTable
        tasks={tasks}
        onEdit={openEditDrawer}
        onDelete={setTaskToDelete}
        onDeleteMany={setTasksToDelete}
        onUpdateMany={(ids, update) =>
          setTasks((current) =>
            current.map((task) =>
              ids.includes(task.id) ? { ...task, ...update } : task
            )
          )
        }
      />

      <TasksMutateDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        currentTask={currentTask}
        onSave={saveTask}
      />
      <TasksImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={(importedTasks) =>
          setTasks((current) => [...importedTasks, ...current])
        }
      />

      <AlertDialog
        open={taskToDelete !== null || tasksToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTaskToDelete(null)
            setTasksToDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task{tasksToDelete?.length === 1 ? '' : 's'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected task
              {tasksToDelete && tasksToDelete.length !== 1 ? 's' : ''} will be
              removed from this list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (taskToDelete) deleteTasks([taskToDelete.id])
                if (tasksToDelete) deleteTasks(tasksToDelete)
                setTaskToDelete(null)
                setTasksToDelete(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
