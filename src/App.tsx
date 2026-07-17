import { Router, Route, Switch } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import Home from './pages/Home'
import RoleHub from './pages/RoleHub'
import Quiz from './pages/Quiz'
import DrillShotClock from './pages/DrillShotClock'
import DrillGameClock from './pages/DrillGameClock'
import DrillSheet from './pages/DrillSheet'
import ToSim from './pages/ToSim'
import Rules from './pages/Rules'
import RuleChapter from './pages/RuleChapter'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
import BottomNav from './components/BottomNav'
import UpdatePrompt from './components/UpdatePrompt'

export default function App() {
  return (
    <Router hook={useHashLocation}>
      <div className="min-h-dvh bg-orange-50 text-slate-800">
        <div className="mx-auto max-w-md px-4 pb-24 pt-4">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/to/:role" component={RoleHub} />
            <Route path="/to/:role/quiz" component={Quiz} />
            <Route path="/quiz" component={Quiz} />
            <Route path="/drill/shotclock" component={DrillShotClock} />
            <Route path="/drill/gameclock" component={DrillGameClock} />
            <Route path="/drill/sheet" component={DrillSheet} />
            <Route path="/tosim/:role" component={ToSim} />
            <Route path="/rules" component={Rules} />
            <Route path="/rules/:slug/:section?" component={RuleChapter} />
            <Route path="/progress" component={Progress} />
            <Route path="/settings" component={Settings} />
            <Route>
              <p className="py-20 text-center text-slate-500">ページが見つかりません</p>
            </Route>
          </Switch>
        </div>
        <BottomNav />
        <UpdatePrompt />
      </div>
    </Router>
  )
}
