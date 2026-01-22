import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { callAIAgent, type NormalizedAgentResponse } from '@/utils/aiAgent'
import {
  LayoutDashboard,
  Trophy,
  Settings as SettingsIcon,
  Sparkles,
  Plus,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart,
  Loader2,
  Save,
  Edit,
  Star,
  TrendingUp,
  Filter,
  FileText,
  Users,
  Award,
  Clock,
  Target
} from 'lucide-react'

// Agent ID from test results
const AGENT_ID = "6972544f1d92f5e2dd22ee9c"

// TypeScript interfaces based on actual test response
interface ScoreBreakdownItem {
  criterion: string
  raw_score: number
  weight: number
  weighted_score: number
}

interface RuleCompliance {
  compliant: boolean
  assessment: string
  theme_alignment: string
}

interface Feedback {
  strengths: string[]
  areas_for_growth: string[]
  creative_insights: string[]
  learning_opportunities: string[]
}

interface EvaluationResult {
  game_name: string
  team_name: string
  weighted_score: number
  max_possible_score: number
  percentage_score: number
  score_breakdown: ScoreBreakdownItem[]
  rule_compliance: RuleCompliance
  feedback: Feedback
  rank_recommendation: string
  summary: string
}

interface EvaluationMetadata {
  agent_name: string
  timestamp: string
  evaluation_version: string
}

interface SavedEvaluation {
  id: string
  result: EvaluationResult
  metadata: EvaluationMetadata
  savedAt: string
}

interface CriteriaWeights {
  originality: number
  aiToolUsage: number
  playability: number
  polish: number
  completeness: number
  presentation: number
  technicalComplexity: number
  accessibility: number
  ruleRelevance: number
}

interface CriteriaScores {
  originality: number
  aiToolUsage: number
  playability: number
  polish: number
  completeness: number
  presentation: number
  technicalComplexity: number
  accessibility: number
  ruleRelevance: number
}

interface EventSettings {
  eventName: string
  themeDescription: string
  rules: string[]
}

// Default weights from PRD
const DEFAULT_WEIGHTS: CriteriaWeights = {
  originality: 15,
  aiToolUsage: 20,
  playability: 15,
  polish: 10,
  completeness: 10,
  presentation: 10,
  technicalComplexity: 5,
  accessibility: 5,
  ruleRelevance: 10
}

// Criteria labels
const CRITERIA_LABELS: Record<keyof CriteriaWeights, string> = {
  originality: 'Originality',
  aiToolUsage: 'AI Tool Usage',
  playability: 'Playability',
  polish: 'Polish',
  completeness: 'Completeness',
  presentation: 'Presentation',
  technicalComplexity: 'Technical Complexity',
  accessibility: 'Accessibility',
  ruleRelevance: 'Rule Relevance'
}

// Helper function to get item from localStorage
function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

// Helper function to set item in localStorage
function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

// Dashboard Section Component
function DashboardSection({
  evaluations,
  onNewEvaluation,
  onViewLeaderboard
}: {
  evaluations: SavedEvaluation[]
  onNewEvaluation: () => void
  onViewLeaderboard: () => void
}) {
  const totalSubmissions = evaluations.length
  const avgScore = evaluations.length > 0
    ? evaluations.reduce((sum, e) => sum + e.result.percentage_score, 0) / evaluations.length
    : 0
  const topRated = evaluations.length > 0
    ? evaluations.reduce((max, e) => e.result.percentage_score > max.result.percentage_score ? e : max)
    : null
  const avgCompliance = evaluations.length > 0
    ? (evaluations.filter(e => e.result.rule_compliance.compliant).length / evaluations.length) * 100
    : 0

  const recentEvaluations = [...evaluations]
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-gray-400">Overview of all game evaluations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stats Cards */}
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-200 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">{totalSubmissions}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-200 flex items-center gap-2">
                <BarChart className="h-5 w-5 text-cyan-400" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">{avgScore.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-200 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Top-Rated Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topRated ? (
                <div>
                  <div className="text-xl font-bold text-white">{topRated.result.game_name}</div>
                  <div className="text-sm text-gray-400">{topRated.result.percentage_score.toFixed(1)}%</div>
                </div>
              ) : (
                <div className="text-gray-500">No evaluations yet</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-200 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Avg Rule Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">{avgCompliance.toFixed(0)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Evaluations */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-gray-200 flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-400" />
              Recent Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvaluations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No evaluations yet. Create your first evaluation to get started.
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {recentEvaluations.map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className="p-4 rounded-lg border border-gray-800 bg-gray-950 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-white">{evaluation.result.game_name}</div>
                          <div className="text-sm text-gray-400">{evaluation.result.team_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-cyan-400">
                            {evaluation.result.percentage_score.toFixed(1)}%
                          </div>
                          {evaluation.result.rule_compliance.compliant ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Compliant
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              Non-Compliant
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(evaluation.savedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button
          onClick={onNewEvaluation}
          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Evaluation
        </Button>
        <Button
          onClick={onViewLeaderboard}
          variant="outline"
          className="border-gray-700 text-gray-200 hover:bg-gray-800"
        >
          <Trophy className="h-4 w-4 mr-2" />
          View Leaderboard
        </Button>
      </div>
    </div>
  )
}

// Evaluate Section Component
function EvaluateSection({
  weights,
  eventSettings
}: {
  weights: CriteriaWeights
  eventSettings: EventSettings
}) {
  const [gameName, setGameName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [description, setDescription] = useState('')
  const [scores, setScores] = useState<CriteriaScores>({
    originality: 0,
    aiToolUsage: 0,
    playability: 0,
    polish: 0,
    completeness: 0,
    presentation: 0,
    technicalComplexity: 0,
    accessibility: 0,
    ruleRelevance: 0
  })
  const [complianceNotes, setComplianceNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [metadata, setMetadata] = useState<EvaluationMetadata | null>(null)

  const handleScoreChange = (criterion: keyof CriteriaScores, value: number) => {
    setScores(prev => ({ ...prev, [criterion]: value }))
  }

  const handleGenerateEvaluation = async () => {
    if (!gameName.trim() || !teamName.trim()) {
      setError('Game name and team name are required')
      return
    }

    // Check if all scores are set (not 0)
    const unscoredCriteria = (Object.keys(scores) as Array<keyof CriteriaScores>).filter(
      criterion => scores[criterion] === 0
    )
    if (unscoredCriteria.length > 0) {
      setError(`Please score all criteria. Missing: ${unscoredCriteria.map(c => CRITERIA_LABELS[c]).join(', ')}`)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const payload = {
        gameName: gameName.trim(),
        teamName: teamName.trim(),
        description: description.trim(),
        scores,
        criteriaWeights: weights,
        eventRules: eventSettings.rules.join('. '),
        complianceNotes: complianceNotes.trim()
      }

      const response = await callAIAgent(JSON.stringify(payload), AGENT_ID)

      if (response.success && response.response.status === 'success') {
        setResult(response.response.result as EvaluationResult)
        setMetadata(response.response.metadata as EvaluationMetadata)
      } else {
        setError(response.error || response.response.message || 'Evaluation failed')
      }
    } catch (e) {
      setError('Network error during evaluation')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (!result || !metadata) return

    const evaluation: SavedEvaluation = {
      id: `eval-${Date.now()}`,
      result,
      metadata,
      savedAt: new Date().toISOString()
    }

    const existing = getLocalStorage<SavedEvaluation[]>('evaluations', [])
    setLocalStorage('evaluations', [...existing, evaluation])

    alert('Evaluation saved successfully!')
  }

  const handleReset = () => {
    setResult(null)
    setMetadata(null)
    setError(null)
    setGameName('')
    setTeamName('')
    setDescription('')
    setComplianceNotes('')
    setScores({
      originality: 0,
      aiToolUsage: 0,
      playability: 0,
      polish: 0,
      completeness: 0,
      presentation: 0,
      technicalComplexity: 0,
      accessibility: 0,
      ruleRelevance: 0
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Evaluate Game</h2>
        <p className="text-gray-400">Score and analyze a game submission</p>
      </div>

      {/* Game Info Section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-200">Game Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gameName" className="text-gray-200">Game Name</Label>
              <Input
                id="gameName"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Enter game name"
                className="bg-gray-950 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamName" className="text-gray-200">Team Name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                className="bg-gray-950 border-gray-700 text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-200">Game Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the game, AI tools used, and how it fits the theme..."
              rows={4}
              className="bg-gray-950 border-gray-700 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Criteria Scoring Grid */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-200">Criteria Scoring</CardTitle>
          <CardDescription className="text-gray-400">
            Rate each criterion from 1-10
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Object.keys(weights) as Array<keyof CriteriaWeights>).map((criterion) => (
              <div key={criterion} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-200">{CRITERIA_LABELS[criterion]}</Label>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {weights[criterion]}%
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    value={scores[criterion]}
                    onChange={(e) => handleScoreChange(criterion, Number(e.target.value))}
                    min={0}
                    max={10}
                    step={1}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="w-16 text-center">
                    {scores[criterion] === 0 ? (
                      <div className="text-sm text-red-400">Not set</div>
                    ) : (
                      <>
                        <div className="text-lg font-bold text-white">{scores[criterion]}</div>
                        <div className="text-xs text-gray-500">/ 10</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rule Compliance Section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-200">Rule Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="complianceNotes" className="text-gray-200">Compliance Notes</Label>
            <Textarea
              id="complianceNotes"
              value={complianceNotes}
              onChange={(e) => setComplianceNotes(e.target.value)}
              placeholder="Note how the game meets or violates event rules..."
              rows={3}
              className="bg-gray-950 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-200">Event Rules</Label>
            <div className="space-y-2">
              {eventSettings.rules.map((rule, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-400">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-cyan-400 flex-shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        onClick={handleGenerateEvaluation}
        disabled={loading || !gameName.trim() || !teamName.trim()}
        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-lg py-6"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Generating Evaluation...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            Generate AI Evaluation
          </>
        )}
      </Button>

      {/* Error Display */}
      {error && (
        <Alert className="bg-red-500/10 border-red-500/30">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-400">Error</AlertTitle>
          <AlertDescription className="text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Panel */}
      {result && (
        <div className="space-y-6">
          <Separator className="bg-gray-800" />

          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">Evaluation Results</h3>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-gray-700 text-gray-200 hover:bg-gray-800"
              >
                <Edit className="h-4 w-4 mr-2" />
                New Evaluation
              </Button>
            </div>
          </div>

          {/* Score Display */}
          <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                  {result.percentage_score.toFixed(1)}%
                </div>
                <div className="text-xl text-gray-300">
                  {result.weighted_score} / {result.max_possible_score} points
                </div>
                <div className="text-sm text-gray-400">
                  {result.game_name} by {result.team_name}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-200 flex items-center gap-2">
                <BarChart className="h-5 w-5 text-purple-400" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.score_breakdown.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">
                        {CRITERIA_LABELS[item.criterion as keyof CriteriaWeights] || item.criterion}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400">
                          Raw: {item.raw_score}/10
                        </span>
                        <span className="text-gray-400">
                          Weight: {item.weight}%
                        </span>
                        <span className="font-semibold text-cyan-400">
                          {item.weighted_score} pts
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={(item.weighted_score / (item.weight * 10)) * 100}
                      className="h-2 bg-gray-800"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rule Compliance */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-200 flex items-center gap-2">
                {result.rule_compliance.compliant ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                Rule Compliance Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge
                  className={cn(
                    result.rule_compliance.compliant
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  )}
                >
                  {result.rule_compliance.compliant ? 'Compliant' : 'Non-Compliant'}
                </Badge>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-200">Assessment</h4>
                <p className="text-gray-400 leading-relaxed">{result.rule_compliance.assessment}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-200">Theme Alignment</h4>
                <p className="text-gray-400 leading-relaxed">{result.rule_compliance.theme_alignment}</p>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-400">
                      <CheckCircle className="h-4 w-4 mt-1 text-green-400 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                  Areas for Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.feedback.areas_for_growth.map((area, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-400">
                      <AlertCircle className="h-4 w-4 mt-1 text-orange-400 flex-shrink-0" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Creative Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.feedback.creative_insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-400">
                      <Sparkles className="h-4 w-4 mt-1 text-purple-400 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center gap-2">
                  <Target className="h-5 w-5 text-cyan-400" />
                  Learning Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.feedback.learning_opportunities.map((opportunity, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-400">
                      <Target className="h-4 w-4 mt-1 text-cyan-400 flex-shrink-0" />
                      <span>{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Rank Recommendation */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-200 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-400" />
                Rank Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 leading-relaxed">{result.rank_recommendation}</p>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-200">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 leading-relaxed">{result.summary}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Leaderboard Section Component
function LeaderboardSection({ evaluations }: { evaluations: SavedEvaluation[] }) {
  const [sortBy, setSortBy] = useState<string>('total')
  const [filterCompliant, setFilterCompliant] = useState<boolean | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const sortedEvaluations = [...evaluations].sort((a, b) => {
    if (sortBy === 'total') {
      return b.result.percentage_score - a.result.percentage_score
    }
    if (sortBy === 'ruleRelevance') {
      const aRule = a.result.score_breakdown.find(s => s.criterion === 'ruleRelevance')
      const bRule = b.result.score_breakdown.find(s => s.criterion === 'ruleRelevance')
      return (bRule?.weighted_score || 0) - (aRule?.weighted_score || 0)
    }
    const aScore = a.result.score_breakdown.find(s => s.criterion === sortBy)
    const bScore = b.result.score_breakdown.find(s => s.criterion === sortBy)
    return (bScore?.weighted_score || 0) - (aScore?.weighted_score || 0)
  })

  const filteredEvaluations = filterCompliant === null
    ? sortedEvaluations
    : sortedEvaluations.filter(e => e.result.rule_compliance.compliant === filterCompliant)

  const exportToCSV = () => {
    const headers = [
      'Rank',
      'Game Name',
      'Team',
      'Total Score',
      'Percentage',
      'Compliant',
      'Originality',
      'AI Tool Usage',
      'Playability',
      'Polish',
      'Completeness',
      'Presentation',
      'Technical Complexity',
      'Accessibility',
      'Rule Relevance'
    ]

    const rows = filteredEvaluations.map((e, index) => {
      const breakdown = e.result.score_breakdown
      return [
        index + 1,
        e.result.game_name,
        e.result.team_name,
        e.result.weighted_score,
        e.result.percentage_score.toFixed(2),
        e.result.rule_compliance.compliant ? 'Yes' : 'No',
        breakdown.find(s => s.criterion === 'originality')?.weighted_score || 0,
        breakdown.find(s => s.criterion === 'aiToolUsage')?.weighted_score || 0,
        breakdown.find(s => s.criterion === 'playability')?.weighted_score || 0,
        breakdown.find(s => s.criterion === 'polish')?.weighted_score || 0,
        breakdown.find(s => s.criterion === 'completeness')?.weighted_score || 0,
        breakdown.find(s => s.criterion === 'presentation')?.weighted_score || 0,
        breakdown.find(s => s.criterion === 'technicalComplexity')?.weighted_score || 0,
        breakdown.find(s => s.criterion === 'accessibility')?.weighted_score || 0,
        breakdown.find(s => s.criterion === 'ruleRelevance')?.weighted_score || 0
      ]
    })

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leaderboard-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Leaderboard</h2>
        <p className="text-gray-400">Rankings and comparisons of all evaluated games</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-gray-200">Sort by:</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px] bg-gray-900 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="total">Total Score</SelectItem>
              <SelectItem value="ruleRelevance">Rule Relevance</SelectItem>
              <SelectItem value="originality">Originality</SelectItem>
              <SelectItem value="aiToolUsage">AI Tool Usage</SelectItem>
              <SelectItem value="playability">Playability</SelectItem>
              <SelectItem value="polish">Polish</SelectItem>
              <SelectItem value="completeness">Completeness</SelectItem>
              <SelectItem value="presentation">Presentation</SelectItem>
              <SelectItem value="technicalComplexity">Technical Complexity</SelectItem>
              <SelectItem value="accessibility">Accessibility</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Button
            variant={filterCompliant === null ? 'default' : 'outline'}
            onClick={() => setFilterCompliant(null)}
            size="sm"
            className={cn(
              filterCompliant === null
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'border-gray-700 text-gray-200 hover:bg-gray-800'
            )}
          >
            All
          </Button>
          <Button
            variant={filterCompliant === true ? 'default' : 'outline'}
            onClick={() => setFilterCompliant(true)}
            size="sm"
            className={cn(
              filterCompliant === true
                ? 'bg-green-600 hover:bg-green-700'
                : 'border-gray-700 text-gray-200 hover:bg-gray-800'
            )}
          >
            Compliant
          </Button>
          <Button
            variant={filterCompliant === false ? 'default' : 'outline'}
            onClick={() => setFilterCompliant(false)}
            size="sm"
            className={cn(
              filterCompliant === false
                ? 'bg-red-600 hover:bg-red-700'
                : 'border-gray-700 text-gray-200 hover:bg-gray-800'
            )}
          >
            Non-Compliant
          </Button>
        </div>

        <Button
          onClick={exportToCSV}
          variant="outline"
          className="ml-auto border-gray-700 text-gray-200 hover:bg-gray-800"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Leaderboard Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          {filteredEvaluations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No evaluations found matching the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-gray-800/50">
                    <TableHead className="text-gray-300 w-16">Rank</TableHead>
                    <TableHead className="text-gray-300">Game Name</TableHead>
                    <TableHead className="text-gray-300">Team</TableHead>
                    <TableHead className="text-gray-300 text-right">Score</TableHead>
                    <TableHead className="text-gray-300 text-center">Compliance</TableHead>
                    <TableHead className="text-gray-300 w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvaluations.map((evaluation, index) => (
                    <>
                      <TableRow
                        key={evaluation.id}
                        className="border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === evaluation.id ? null : evaluation.id)}
                      >
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center gap-2">
                            {index === 0 && <Trophy className="h-5 w-5 text-yellow-400" />}
                            {index === 1 && <Trophy className="h-5 w-5 text-gray-400" />}
                            {index === 2 && <Trophy className="h-5 w-5 text-orange-400" />}
                            <span>{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-white">
                          {evaluation.result.game_name}
                        </TableCell>
                        <TableCell className="text-gray-400">{evaluation.result.team_name}</TableCell>
                        <TableCell className="text-right">
                          <div className="text-lg font-bold text-cyan-400">
                            {evaluation.result.percentage_score.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {evaluation.result.weighted_score} pts
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {evaluation.result.rule_compliance.compliant ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Yes
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              <XCircle className="h-3 w-3 mr-1" />
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {expandedRow === evaluation.id ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedRow === evaluation.id && (
                        <TableRow className="border-gray-800">
                          <TableCell colSpan={6} className="bg-gray-950 p-6">
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                {evaluation.result.score_breakdown.map((item) => (
                                  <div key={item.criterion} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-400">
                                        {CRITERIA_LABELS[item.criterion as keyof CriteriaWeights] || item.criterion}
                                      </span>
                                      <span className="font-semibold text-cyan-400">
                                        {item.weighted_score}
                                      </span>
                                    </div>
                                    <Progress
                                      value={(item.weighted_score / (item.weight * 10)) * 100}
                                      className="h-1 bg-gray-800"
                                    />
                                  </div>
                                ))}
                              </div>
                              <Separator className="bg-gray-800" />
                              <div className="text-sm text-gray-400">
                                <span className="font-semibold text-gray-300">Summary: </span>
                                {evaluation.result.summary}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Settings Section Component
function SettingsSection({
  eventSettings,
  onEventSettingsChange,
  weights,
  onWeightsChange
}: {
  eventSettings: EventSettings
  onEventSettingsChange: (settings: EventSettings) => void
  weights: CriteriaWeights
  onWeightsChange: (weights: CriteriaWeights) => void
}) {
  const [localSettings, setLocalSettings] = useState(eventSettings)
  const [localWeights, setLocalWeights] = useState(weights)
  const [newRule, setNewRule] = useState('')

  const totalWeight = Object.values(localWeights).reduce((sum, w) => sum + w, 0)

  const handleSave = () => {
    if (totalWeight !== 100) {
      alert('Warning: Total weight must equal 100%')
      return
    }
    onEventSettingsChange(localSettings)
    onWeightsChange(localWeights)
    setLocalStorage('eventSettings', localSettings)
    setLocalStorage('criteriaWeights', localWeights)
    alert('Settings saved successfully!')
  }

  const handleAddRule = () => {
    if (newRule.trim()) {
      setLocalSettings(prev => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()]
      }))
      setNewRule('')
    }
  }

  const handleRemoveRule = (index: number) => {
    setLocalSettings(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
        <p className="text-gray-400">Configure event rules and scoring criteria</p>
      </div>

      {/* Event Settings */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-200">Event Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventName" className="text-gray-200">Event Name</Label>
            <Input
              id="eventName"
              value={localSettings.eventName}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, eventName: e.target.value }))}
              className="bg-gray-950 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="themeDescription" className="text-gray-200">Theme Description</Label>
            <Textarea
              id="themeDescription"
              value={localSettings.themeDescription}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, themeDescription: e.target.value }))}
              rows={3}
              className="bg-gray-950 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-200">Event Rules</Label>
            <div className="space-y-2">
              {localSettings.rules.map((rule, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1 p-3 rounded bg-gray-950 border border-gray-700 text-gray-300">
                    {rule}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveRule(index)}
                    className="border-red-700 text-red-400 hover:bg-red-900/20"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="Add a new rule..."
                className="bg-gray-950 border-gray-700 text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
              />
              <Button
                onClick={handleAddRule}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criteria Weights */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-200">Criteria Weights</CardTitle>
          <CardDescription className="text-gray-400">
            Configure the percentage weight for each criterion (must total 100%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(localWeights) as Array<keyof CriteriaWeights>).map((criterion) => (
              <div key={criterion} className="space-y-2">
                <Label className="text-gray-200">{CRITERIA_LABELS[criterion]}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={localWeights[criterion]}
                    onChange={(e) => setLocalWeights(prev => ({
                      ...prev,
                      [criterion]: Math.max(0, Math.min(100, Number(e.target.value)))
                    }))}
                    className="bg-gray-950 border-gray-700 text-white"
                  />
                  <span className="text-gray-400 min-w-[24px]">%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Weight Validator */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 font-semibold">Total Weight:</span>
              <span className={cn(
                'text-xl font-bold',
                totalWeight === 100 ? 'text-green-400' : 'text-red-400'
              )}>
                {totalWeight}%
              </span>
            </div>
            <Progress
              value={totalWeight}
              className={cn(
                'h-3',
                totalWeight === 100 ? 'bg-green-900/20' : 'bg-red-900/20'
              )}
            />
            {totalWeight !== 100 && (
              <Alert className="mt-4 bg-orange-500/10 border-orange-500/30">
                <AlertCircle className="h-4 w-4 text-orange-400" />
                <AlertTitle className="text-orange-400">Weight Validation</AlertTitle>
                <AlertDescription className="text-orange-300">
                  Total weight must equal 100%. Current total: {totalWeight}%
                  {totalWeight < 100 && ` (${100 - totalWeight}% remaining)`}
                  {totalWeight > 100 && ` (${totalWeight - 100}% over)`}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={totalWeight !== 100}
        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-lg py-6"
      >
        <Save className="h-5 w-5 mr-2" />
        Save Configuration
      </Button>
    </div>
  )
}

// Main App Component
export default function Home() {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'evaluate' | 'leaderboard' | 'settings'>('dashboard')
  const [evaluations, setEvaluations] = useState<SavedEvaluation[]>([])
  const [eventSettings, setEventSettings] = useState<EventSettings>({
    eventName: 'AI Game Jam 2024',
    themeDescription: 'Artistic Expression through AI',
    rules: [
      'Game must use at least 2 AI tools',
      'Game must be playable in browser',
      'Must align with the Artistic Expression theme'
    ]
  })
  const [weights, setWeights] = useState<CriteriaWeights>(DEFAULT_WEIGHTS)

  // Load from localStorage on mount
  useEffect(() => {
    const savedEvaluations = getLocalStorage<SavedEvaluation[]>('evaluations', [])
    const savedSettings = getLocalStorage<EventSettings>('eventSettings', eventSettings)
    const savedWeights = getLocalStorage<CriteriaWeights>('criteriaWeights', DEFAULT_WEIGHTS)

    setEvaluations(savedEvaluations)
    setEventSettings(savedSettings)
    setWeights(savedWeights)
  }, [])

  // Save evaluations to localStorage when they change
  useEffect(() => {
    const interval = setInterval(() => {
      const savedEvaluations = getLocalStorage<SavedEvaluation[]>('evaluations', [])
      setEvaluations(savedEvaluations)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-900/80 border-b border-gray-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{eventSettings.eventName}</h1>
                <p className="text-xs text-gray-400">AI Judging Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-300">Judge Panel</div>
                <div className="text-xs text-gray-500">AI-Powered Evaluation</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                activeSection === 'dashboard'
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveSection('evaluate')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                activeSection === 'evaluate'
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">Evaluate</span>
            </button>

            <button
              onClick={() => setActiveSection('leaderboard')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                activeSection === 'leaderboard'
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Trophy className="h-5 w-5" />
              <span className="font-medium">Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveSection('settings')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                activeSection === 'settings'
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <SettingsIcon className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          <div className="container mx-auto max-w-7xl">
            {activeSection === 'dashboard' && (
              <DashboardSection
                evaluations={evaluations}
                onNewEvaluation={() => setActiveSection('evaluate')}
                onViewLeaderboard={() => setActiveSection('leaderboard')}
              />
            )}

            {activeSection === 'evaluate' && (
              <EvaluateSection weights={weights} eventSettings={eventSettings} />
            )}

            {activeSection === 'leaderboard' && (
              <LeaderboardSection evaluations={evaluations} />
            )}

            {activeSection === 'settings' && (
              <SettingsSection
                eventSettings={eventSettings}
                onEventSettingsChange={setEventSettings}
                weights={weights}
                onWeightsChange={setWeights}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
