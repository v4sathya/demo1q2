"use client"

import { useState, useRef } from "react"
import { AlertCircle, CheckCircle, ChevronDown, Download, Filter, Send, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

// Mock data - can be replaced with real data later
const mockData = [
  {
    id: 1,
    department: "Finance",
    task: "Deploy API keys",
    completed: false,
    riskLevel: "High",
    notes: "Assumed handled by another team.",
  },
  {
    id: 2,
    department: "Engineering",
    task: "Update security patches",
    completed: false,
    riskLevel: "High",
    notes: "Delayed due to resource constraints.",
  },
  {
    id: 3,
    department: "HR",
    task: "Update employee handbook",
    completed: true,
    riskLevel: "None",
    notes: "Completed on schedule.",
  },
  {
    id: 4,
    department: "Marketing",
    task: "Review campaign analytics",
    completed: true,
    riskLevel: "None",
    notes: "No issues found.",
  },
  {
    id: 5,
    department: "IT",
    task: "Backup database",
    completed: false,
    riskLevel: "Medium",
    notes: "Scheduled for next week.",
  },
  {
    id: 6,
    department: "Finance",
    task: "Quarterly audit",
    completed: false,
    riskLevel: "High",
    notes: "Critical findings need immediate attention.",
  },
  {
    id: 7,
    department: "Engineering",
    task: "Code review",
    completed: false,
    riskLevel: "High",
    notes: "Critical vulnerabilities found.",
  },
  {
    id: 8,
    department: "Data",
    task: "Update data privacy policy",
    completed: false,
    riskLevel: "Medium",
    notes: "Needs legal review.",
  },
]

// High risk keywords
const HIGH_RISK_KEYWORDS = ["assumed", "unverified", "outdated", "no one responded", "critical", "urgent", "failed"]
const MEDIUM_RISK_KEYWORDS = ["delayed", "pending", "waiting", "scheduled", "partial"]

export default function QARiskDashboard() {
  const [data, setData] = useState(mockData)
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("")
  const fileInputRef = useRef(null)
  const [activeFilter, setActiveFilter] = useState("all") // "all", "incomplete", or "highRisk"
  const [selectedFileName, setSelectedFileName] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [suggestions, setSuggestions] = useState({})
  const [currentSuggestion, setCurrentSuggestion] = useState({})
  const [checkedItems, setCheckedItems] = useState({})

  // Calculate summary metrics
  const incompleteTasks = data.filter((task) => !task.completed).length
  const highRiskIssues = data.filter((task) => task.riskLevel === "High").length

  // Get high risk tasks for alerts
  const highRiskTasks = data.filter((task) => task.riskLevel === "High" && !task.completed)

  // Get flagged tasks for checklist (incomplete or risky)
  const flaggedTasks = data.filter((task) => !task.completed || task.riskLevel !== "None")

  // Group flagged tasks by department and sort departments alphabetically
  const flaggedTasksByDepartment = flaggedTasks.reduce((acc, task) => {
    if (!acc[task.department]) {
      acc[task.department] = []
    }
    acc[task.department].push(task)
    return acc
  }, {})

  // Get sorted department names
  const sortedDepartments = Object.keys(flaggedTasksByDepartment).sort()

  // Get unique departments for filter
  const departments = ["all", ...new Set(data.map((task) => task.department))].sort()

  // Group high risk tasks by department
  const highRiskTasksByDepartment = highRiskTasks.reduce((acc, task) => {
    if (!acc[task.department]) {
      acc[task.department] = []
    }
    acc[task.department].push(task)
    return acc
  }, {})

  // Function to truncate notes for the checklist
  const truncateNotes = (notes, maxLength = 50) => {
    if (notes.length <= maxLength) return notes
    return notes.substring(0, maxLength) + "..."
  }

  const runQACheck = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      // In a real app, this would fetch fresh data
      // For now, we'll just use the mock data
    }, 1500)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    setSelectedFileName(file.name)
    setUploadStatus("Uploading...")

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csvData = e.target.result
        const parsedData = parseCSV(csvData)
        setData(parsedData)
        setUploadStatus(`Successfully uploaded ${parsedData.length} tasks`)

        // Reset checked items when new data is loaded
        setCheckedItems({})

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } catch (error) {
        console.error("Error parsing CSV:", error)
        setUploadStatus("Error parsing CSV file. Please check the format.")
      }
    }

    reader.onerror = () => {
      setUploadStatus("Error reading file")
      setSelectedFileName("")
    }

    reader.readAsText(file)
  }

  const parseCSV = (csvText) => {
    // Split by lines and remove empty lines
    const lines = csvText.split("\n").filter((line) => line.trim() !== "")

    // Get headers from first line
    const headers = lines[0].split(",").map((header) => header.trim())

    // Map expected headers to our data structure
    const departmentIndex = headers.findIndex((h) => h.toLowerCase() === "department")
    const taskIndex = headers.findIndex((h) => h.toLowerCase() === "task")
    const completedIndex = headers.findIndex(
      (h) => h.toLowerCase() === "task_completed" || h.toLowerCase() === "completed",
    )
    const notesIndex = headers.findIndex((h) => h.toLowerCase() === "notes")

    // Validate required columns exist
    if (departmentIndex === -1 || taskIndex === -1 || completedIndex === -1) {
      throw new Error("CSV is missing required columns")
    }

    // Parse data rows
    return lines.slice(1).map((line, index) => {
      // Handle commas within quoted fields
      const values = []
      let inQuotes = false
      let currentValue = ""

      for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(currentValue)
          currentValue = ""
        } else {
          currentValue += char
        }
      }

      // Add the last value
      values.push(currentValue)

      // Clean up values (remove quotes and trim)
      const cleanValues = values.map((val) => val.trim().replace(/^"|"$/g, "").trim())

      // Get values from the correct columns
      const department = cleanValues[departmentIndex] || ""
      const task = cleanValues[taskIndex] || ""
      const completedValue = cleanValues[completedIndex] || ""
      const notes = notesIndex !== -1 ? cleanValues[notesIndex] || "" : ""

      // Determine if task is completed
      const completed =
        completedValue.toLowerCase() === "yes" || completedValue.toLowerCase() === "true" || completedValue === "1"

      // Determine risk level based on completion and notes
      const riskLevel = determineRiskLevel(completed, notes)

      return {
        id: index + 1,
        department,
        task,
        completed,
        riskLevel,
        notes,
      }
    })
  }

  const determineRiskLevel = (completed, notes) => {
    // Convert notes to lowercase for case-insensitive matching
    const notesLower = notes.toLowerCase()

    // Check for high risk keywords
    if (HIGH_RISK_KEYWORDS.some((keyword) => notesLower.includes(keyword))) {
      return "High"
    }

    // If task is not completed, it's at least medium risk
    if (!completed) {
      // Check for medium risk keywords to potentially escalate
      if (MEDIUM_RISK_KEYWORDS.some((keyword) => notesLower.includes(keyword))) {
        return "High"
      }
      return "Medium"
    }

    // Check for medium risk keywords even if completed
    if (MEDIUM_RISK_KEYWORDS.some((keyword) => notesLower.includes(keyword))) {
      return "Medium"
    }

    // Default risk level
    return "None"
  }

  // Function to convert data to CSV format
  const convertToCSV = (dataToExport) => {
    // Define headers
    const headers = ["Department", "Task", "Completed", "Risk Level", "Notes"]

    // Create CSV content
    const csvRows = []

    // Add headers
    csvRows.push(headers.join(","))

    // Add data rows
    dataToExport.forEach((item) => {
      const row = [
        `"${item.department.replace(/"/g, '""')}"`,
        `"${item.task.replace(/"/g, '""')}"`,
        item.completed ? "Yes" : "No",
        `"${item.riskLevel}"`,
        `"${item.notes.replace(/"/g, '""')}"`,
      ]
      csvRows.push(row.join(","))
    })

    return csvRows.join("\n")
  }

  // Function to download data as CSV
  const downloadCSV = (dataToExport, filename = "qa-alerts.csv") => {
    const csv = convertToCSV(dataToExport)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })

    // Create download link
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Function to download filtered data
  const downloadFilteredData = () => {
    let dataToExport

    if (activeFilter === "incomplete") {
      dataToExport = data.filter((task) => !task.completed)
      downloadCSV(dataToExport, "incomplete-tasks.csv")
    } else if (activeFilter === "highRisk") {
      dataToExport = data.filter((task) => task.riskLevel === "High")
      downloadCSV(dataToExport, "high-risk-tasks.csv")
    } else {
      // Default: download all data
      downloadCSV(data, "all-tasks.csv")
    }
  }

  // Function to download alerts
  const downloadAlerts = () => {
    downloadCSV(highRiskTasks, "high-risk-alerts.csv")
  }

  // Function to download checklist
  const downloadChecklist = () => {
    const checklistData = flaggedTasks.map((task) => ({
      ...task,
      notes: truncateNotes(task.notes),
    }))
    downloadCSV(checklistData, "qa-checklist.csv")
  }

  // Handle suggestion input change
  const handleSuggestionChange = (taskId, value) => {
    setCurrentSuggestion({
      ...currentSuggestion,
      [taskId]: value,
    })
  }

  // Submit suggestion
  const submitSuggestion = (taskId) => {
    if (currentSuggestion[taskId]?.trim()) {
      setSuggestions({
        ...suggestions,
        [taskId]: [...(suggestions[taskId] || []), currentSuggestion[taskId]],
      })
      // Clear current suggestion for this task
      setCurrentSuggestion({
        ...currentSuggestion,
        [taskId]: "",
      })
    }
  }

  // Toggle checklist item
  const toggleChecklistItem = (taskId) => {
    setCheckedItems({
      ...checkedItems,
      [taskId]: !checkedItems[taskId],
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">QA Risk Dashboard</h1>

      {/* Run QA Check Button and CSV Upload */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button onClick={runQACheck} disabled={loading} size="lg" className="w-full sm:w-auto">
          {loading ? "Running Check..." : "Run QA Check"}
        </Button>

        <div className="flex-1 flex flex-col sm:flex-row gap-2 items-center">
          <div className="relative w-full">
            <div className="flex items-center">
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-l-md"
              >
                Choose File
              </label>
              <div className="border border-l-0 rounded-r-md px-4 py-2 bg-background flex-1 truncate">
                {selectedFileName || "No file chosen"}
              </div>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </div>
          </div>
          {uploadStatus && <div className="text-sm text-muted-foreground">{uploadStatus}</div>}
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card
          className={`${
            activeFilter === "incomplete" ? "bg-amber-100 border-amber-300" : "bg-amber-50 border-amber-200"
          } cursor-pointer transition-colors`}
          onClick={() => setActiveFilter(activeFilter === "incomplete" ? "all" : "incomplete")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              Incomplete Tasks
              {activeFilter === "incomplete" && (
                <Badge variant="outline" className="ml-2">
                  Filtered
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{incompleteTasks}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Click to {activeFilter === "incomplete" ? "clear filter" : "show only incomplete tasks"}
            </p>
          </CardContent>
        </Card>

        <Card
          className={`${
            activeFilter === "highRisk" ? "bg-red-100 border-red-300" : "bg-red-50 border-red-200"
          } cursor-pointer transition-colors`}
          onClick={() => setActiveFilter(activeFilter === "highRisk" ? "all" : "highRisk")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              High-Risk Issues
              {activeFilter === "highRisk" && (
                <Badge variant="outline" className="ml-2">
                  Filtered
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{highRiskIssues}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Click to {activeFilter === "highRisk" ? "clear filter" : "show only high-risk issues"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CSV Upload Instructions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>CSV Upload Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">Upload a CSV file with the following columns:</p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            <li>Department - The department responsible for the task</li>
            <li>Task - The task description</li>
            <li>Task_Completed - "Yes" or "No" indicating completion status</li>
            <li>Notes - Additional notes (will be scanned for risk keywords)</li>
          </ul>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>QA Tasks</CardTitle>
          <div className="flex items-center gap-2">
            {activeFilter !== "all" && (
              <Badge variant={activeFilter === "incomplete" ? "warning" : "destructive"}>
                {activeFilter === "incomplete" ? "Showing Incomplete Tasks" : "Showing High-Risk Issues"}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={downloadFilteredData}>
              <Download className="h-4 w-4 mr-2" />
              Download {activeFilter !== "all" ? "Filtered" : "All"} Tasks
            </Button>
            {activeFilter !== "all" && (
              <Button variant="outline" size="sm" onClick={() => setActiveFilter("all")}>
                Clear Filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 border">
                    <div className="flex items-center justify-between">
                      Department
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Filter className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            className={departmentFilter === "all" ? "bg-muted" : ""}
                            onClick={() => setDepartmentFilter("all")}
                          >
                            All Departments
                          </DropdownMenuItem>
                          {departments
                            .filter((dept) => dept !== "all")
                            .map((dept) => (
                              <DropdownMenuItem
                                key={dept}
                                className={departmentFilter === dept ? "bg-muted" : ""}
                                onClick={() => setDepartmentFilter(dept)}
                              >
                                {dept}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </th>
                  <th className="text-left p-3 border">Task</th>
                  <th className="text-left p-3 border">Status</th>
                  <th className="text-left p-3 border">Risk Level</th>
                  <th className="text-left p-3 border">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data
                  .filter((task) => {
                    // Apply department filter
                    if (departmentFilter !== "all" && task.department !== departmentFilter) return false

                    // Apply task status/risk filter
                    if (activeFilter === "incomplete") return !task.completed
                    if (activeFilter === "highRisk") return task.riskLevel === "High"
                    return true // "all" filter shows everything
                  })
                  .map((task) => (
                    <tr key={task.id} className="hover:bg-muted/50">
                      <td className="p-3 border">{task.department}</td>
                      <td className="p-3 border">{task.task}</td>
                      <td className="p-3 border">
                        {task.completed ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-5 w-5" />
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <XCircle className="h-5 w-5" />
                          </span>
                        )}
                      </td>
                      <td className="p-3 border">
                        <RiskBadge level={task.riskLevel} />
                      </td>
                      <td className="p-3 border">{task.notes}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alert Cards */}
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Risk Alerts</h2>
          {highRiskTasks.length > 0 && (
            <Button variant="outline" size="sm" onClick={downloadAlerts}>
              <Download className="h-4 w-4 mr-2" />
              Download Alerts
            </Button>
          )}
        </div>

        {Object.keys(highRiskTasksByDepartment).length > 0 ? (
          Object.entries(highRiskTasksByDepartment).map(([department, tasks]) => (
            <Collapsible key={department} className="mb-4">
              <div className="bg-red-50 border border-red-200 rounded-t-lg p-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Badge variant="destructive" className="mr-2">
                      {department}
                    </Badge>
                    <span className="font-medium">
                      {tasks.length} high-risk {tasks.length === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                {tasks.map((task) => (
                  <div key={task.id} className="border border-t-0 border-red-200 p-4 last:rounded-b-lg">
                    <Alert variant="destructive" className="mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="font-medium">🚨 {task.task} - not completed</AlertTitle>
                      <AlertDescription>Note: "{task.notes}"</AlertDescription>
                    </Alert>

                    {/* Suggestion Box */}
                    <div className="mt-3 bg-muted/50 p-3 rounded-md">
                      <h4 className="text-sm font-medium mb-2">Suggestions for {department}</h4>

                      {/* Display existing suggestions */}
                      {suggestions[task.id]?.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {suggestions[task.id].map((suggestion, idx) => (
                            <div key={idx} className="bg-background p-2 rounded text-sm">
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add new suggestion */}
                      <div className="flex gap-2">
                        <Textarea
                          placeholder={`Add suggestion for ${department} regarding "${task.task}"`}
                          className="text-sm min-h-[60px]"
                          value={currentSuggestion[task.id] || ""}
                          onChange={(e) => handleSuggestionChange(task.id, e.target.value)}
                        />
                        <Button
                          size="sm"
                          className="self-end"
                          onClick={() => submitSuggestion(task.id)}
                          disabled={!currentSuggestion[task.id]?.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))
        ) : (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>No high-risk alerts</AlertTitle>
            <AlertDescription>All high-risk tasks have been completed.</AlertDescription>
          </Alert>
        )}
      </div>

      {/* QA Summary Checklist */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>QA Summary Checklist</CardTitle>
          <Button variant="outline" size="sm" onClick={downloadChecklist}>
            <Download className="h-4 w-4 mr-2" />
            Download Checklist
          </Button>
        </CardHeader>
        <CardContent>
          {sortedDepartments.length > 0 ? (
            <div className="space-y-6">
              {sortedDepartments.map((department) => (
                <div key={department} className="space-y-2">
                  <h3 className="font-medium text-lg">{department}</h3>
                  <Separator className="my-2" />
                  {flaggedTasksByDepartment[department].map((task) => (
                    <div key={task.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded-md">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center mt-0.5">
                        <Checkbox
                          id={`task-${task.id}`}
                          checked={checkedItems[task.id] || false}
                          onCheckedChange={() => toggleChecklistItem(task.id)}
                        />
                      </div>
                      <label
                        htmlFor={`task-${task.id}`}
                        className={`text-sm leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                          checkedItems[task.id] ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        <span className="font-medium">{task.task}</span>{" "}
                        <span className="text-muted-foreground">(note: {truncateNotes(task.notes)})</span>
                        {!task.completed && (
                          <Badge variant="outline" className="ml-2 bg-red-50 text-red-800 border-red-200">
                            Incomplete
                          </Badge>
                        )}
                        {task.riskLevel !== "None" && (
                          <Badge
                            variant="outline"
                            className={`ml-2 ${
                              task.riskLevel === "High"
                                ? "bg-red-50 text-red-800 border-red-200"
                                : "bg-yellow-50 text-yellow-800 border-yellow-200"
                            }`}
                          >
                            {task.riskLevel} Risk
                          </Badge>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No flagged tasks found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Risk Badge Component
function RiskBadge({ level }) {
  switch (level) {
    case "High":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
          High
        </Badge>
      )
    case "Medium":
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
          Medium
        </Badge>
      )
    case "None":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
          None
        </Badge>
      )
    default:
      return <Badge variant="outline">{level}</Badge>
  }
}
