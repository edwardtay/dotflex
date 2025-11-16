import { useState, useEffect } from 'react'
import { ApiPromise } from '@polkadot/api'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import './PlayView.css'

interface PlayViewProps {
  api: ApiPromise | null
  accounts: InjectedAccountWithMeta[]
}

type GameMode = 'coin' | 'dice'

export default function PlayView({ api, accounts }: PlayViewProps) {
  const [gameMode, setGameMode] = useState<GameMode>('coin')
  const [choice, setChoice] = useState<'heads' | 'tails' | number | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [result, setResult] = useState<'heads' | 'tails' | number | null>(null)
  const [won, setWon] = useState<boolean | null>(null)
  const [score, setScore] = useState({ wins: 0, losses: 0 })
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dotflex-game-stats')
    if (saved) {
      const stats = JSON.parse(saved)
      setScore(stats.score || { wins: 0, losses: 0 })
      setBestStreak(stats.bestStreak || 0)
    }
  }, [])

  const playSound = (type: 'win' | 'lose' | 'flip') => {
    if (!soundEnabled) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    if (type === 'win') {
      osc.frequency.value = 800
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } else if (type === 'lose') {
      osc.frequency.value = 200
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } else {
      osc.frequency.value = 400
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    }
  }

  const flipCoin = async () => {
    if (!choice) return
    
    setIsFlipping(true)
    setResult(null)
    setWon(null)
    playSound('flip')

    await new Promise(resolve => setTimeout(resolve, 2000))

    const random = crypto.getRandomValues(new Uint32Array(1))[0]
    const coinResult: 'heads' | 'tails' = random % 2 === 0 ? 'heads' : 'tails'
    const didWin = coinResult === choice

    setResult(coinResult)
    setWon(didWin)
    
    const newScore = {
      wins: score.wins + (didWin ? 1 : 0),
      losses: score.losses + (didWin ? 0 : 1)
    }
    const newStreak = didWin ? streak + 1 : 0
    const newBestStreak = Math.max(bestStreak, newStreak)
    
    setScore(newScore)
    setStreak(newStreak)
    setBestStreak(newBestStreak)
    
    localStorage.setItem('dotflex-game-stats', JSON.stringify({
      score: newScore,
      bestStreak: newBestStreak
    }))
    
    playSound(didWin ? 'win' : 'lose')
    setIsFlipping(false)
  }

  const rollDice = async () => {
    if (choice === null) return
    
    setIsFlipping(true)
    setResult(null)
    setWon(null)
    playSound('flip')

    await new Promise(resolve => setTimeout(resolve, 2000))

    const random = crypto.getRandomValues(new Uint32Array(1))[0]
    const diceResult = (random % 6) + 1
    const didWin = diceResult === choice

    setResult(diceResult)
    setWon(didWin)
    
    const newScore = {
      wins: score.wins + (didWin ? 1 : 0),
      losses: score.losses + (didWin ? 0 : 1)
    }
    const newStreak = didWin ? streak + 1 : 0
    const newBestStreak = Math.max(bestStreak, newStreak)
    
    setScore(newScore)
    setStreak(newStreak)
    setBestStreak(newBestStreak)
    
    localStorage.setItem('dotflex-game-stats', JSON.stringify({
      score: newScore,
      bestStreak: newBestStreak
    }))
    
    playSound(didWin ? 'win' : 'lose')
    setIsFlipping(false)
  }

  const reset = () => {
    setChoice(null)
    setResult(null)
    setWon(null)
  }

  const switchMode = (mode: GameMode) => {
    setGameMode(mode)
    reset()
  }

  return (
    <div className="play-view">
      <div className="game-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <svg width="40" height="40" viewBox="0 0 1326 1410" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="663" cy="147.33" rx="254" ry="147.33" fill="#E6007A"/>
            <ellipse cx="663" cy="1262.7" rx="254" ry="147.33" fill="#E6007A"/>
            <ellipse cx="663" cy="705" rx="254" ry="147.33" fill="#E6007A"/>
            <ellipse cx="180" cy="426.16" rx="180" ry="104.16" fill="#E6007A"/>
            <ellipse cx="1146" cy="426.16" rx="180" ry="104.16" fill="#E6007A"/>
            <ellipse cx="180" cy="983.84" rx="180" ry="104.16" fill="#E6007A"/>
            <ellipse cx="1146" cy="983.84" rx="180" ry="104.16" fill="#E6007A"/>
          </svg>
          <h2>Fun Games</h2>
        </div>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)} 
          className="sound-toggle"
          title={soundEnabled ? 'Sound On' : 'Sound Off'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>
      <p className="description">Pick your game and test your luck on Polkadot!</p>

      <div className="game-mode-selector">
        <button 
          onClick={() => switchMode('coin')} 
          className={`mode-btn ${gameMode === 'coin' ? 'active' : ''}`}
        >
          🪙 Coin Flip
        </button>
        <button 
          onClick={() => switchMode('dice')} 
          className={`mode-btn ${gameMode === 'dice' ? 'active' : ''}`}
        >
          🎲 Dice Roll
        </button>
      </div>

      <div className="score-board">
        <div className="score-item wins">Wins: {score.wins}</div>
        <div className="score-item losses">Losses: {score.losses}</div>
        <div className="score-item streak">Streak: {streak} 🔥</div>
        <div className="score-item best">Best: {bestStreak}</div>
      </div>

      {gameMode === 'coin' && (
        <>
          {!choice && !isFlipping && (
            <div className="choice-section">
              <h3>Choose Your Side</h3>
              <div className="choice-buttons">
                <button onClick={() => setChoice('heads')} className="choice-btn heads-btn">
                  <span className="coin-emoji">🟡</span>
                  <span>HEADS</span>
                </button>
                <button onClick={() => setChoice('tails')} className="choice-btn tails-btn">
                  <span className="coin-emoji">⚪</span>
                  <span>TAILS</span>
                </button>
              </div>
            </div>
          )}

          {choice && !isFlipping && result === null && (
            <div className="flip-section">
              <p className="your-choice">You chose: <strong>{String(choice).toUpperCase()}</strong></p>
              <button onClick={flipCoin} className="flip-btn">Flip Coin!</button>
              <button onClick={reset} className="reset-btn">Change Choice</button>
            </div>
          )}

          {isFlipping && (
            <div className="flipping-section">
              <div className="coin-flip"></div>
              <p className="flipping-text">Flipping...</p>
            </div>
          )}

          {result && won !== null && (
            <div className={`result-section ${won ? 'won' : 'lost'}`}>
              <h3>{won ? '🎉 You Won!' : '😔 You Lost!'}</h3>
              <p className="result-text">The coin landed on: <strong>{String(result).toUpperCase()}</strong></p>
              {streak > 1 && <p className="streak-text">🔥 {streak} win streak!</p>}
              <button onClick={reset} className="play-again-btn">Play Again</button>
            </div>
          )}
        </>
      )}

      {gameMode === 'dice' && (
        <>
          {!choice && !isFlipping && (
            <div className="choice-section">
              <h3>Pick a Number (1-6)</h3>
              <div className="dice-buttons">
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <button key={num} onClick={() => setChoice(num)} className="dice-btn">
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {choice && !isFlipping && result === null && (
            <div className="flip-section">
              <p className="your-choice">You picked: <strong>{choice}</strong></p>
              <button onClick={rollDice} className="flip-btn">Roll Dice!</button>
              <button onClick={reset} className="reset-btn">Change Number</button>
            </div>
          )}

          {isFlipping && (
            <div className="flipping-section">
              <div className="dice-roll">🎲</div>
              <p className="flipping-text">Rolling...</p>
            </div>
          )}

          {result && won !== null && (
            <div className={`result-section ${won ? 'won' : 'lost'}`}>
              <h3>{won ? '🎉 You Won!' : '😔 You Lost!'}</h3>
              <p className="result-text">The dice rolled: <strong>{result}</strong></p>
              {streak > 1 && <p className="streak-text">🔥 {streak} win streak!</p>}
              <button onClick={reset} className="play-again-btn">Play Again</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
