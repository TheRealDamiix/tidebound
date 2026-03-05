import GameHUD from '../components/game/GameHUD'
import ActionBar from '../components/game/ActionBar'
import ShipPanel from '../components/game/ShipPanel'
import PortPanel from '../components/game/PortPanel'
import MapCanvas from '../components/game/MapCanvas'
import ReputationPanel from '../components/game/ReputationPanel'
import CaptainsLog from '../components/game/CaptainsLog'
import BattleScreen from '../components/game/BattleScreen'
import SailModal from '../components/game/SailModal'
import EventModal from '../components/game/EventModal'
import Toast from '../components/game/Toast'

export default function GamePage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-ocean-deep text-sand-light">
      <GameHUD />
      <ActionBar />
      <div className="flex-1 overflow-auto p-3">
        <div className="grid gap-3" style={{ gridTemplateColumns: '220px 1fr 220px' }}>
          <div className="flex flex-col gap-3"><ShipPanel /><ReputationPanel /></div>
          <div className="flex flex-col gap-3"><MapCanvas /><CaptainsLog /></div>
          <div className="flex flex-col gap-3"><PortPanel /></div>
        </div>
      </div>
      <BattleScreen />
      <SailModal />
      <EventModal />
      <Toast />
    </div>
  )
}