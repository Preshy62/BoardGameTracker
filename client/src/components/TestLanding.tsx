import { useState } from 'react';

export default function TestLanding() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const gameModes = [
    {
      id: 'strategy',
      title: 'Strategy Arena',
      description: 'Advanced AI Opponents with strategic depth',
      features: ['Enhanced AI', 'Strategic Gameplay', 'Professional Level'],
      color: '#8b5cf6'
    },
    {
      id: 'quick',
      title: 'Quick Match',
      description: 'Fast-paced gaming for instant action',
      features: ['Instant Play', 'Quick Sessions', 'Dynamic Rounds'],
      color: '#06b6d4'
    },
    {
      id: 'bot',
      title: 'Bot Challenge',
      description: 'Enhanced AI with multiple difficulty levels',
      features: ['AI Training', 'Skill Building', 'Progressive Difficulty'],
      color: '#10b981'
    },
    {
      id: 'tournament',
      title: 'Tournament',
      description: 'Professional competitive gaming',
      features: ['Elite Competition', 'Rankings', 'Prizes'],
      color: '#f59e0b'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      color: 'white',
      padding: '40px 20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <div style={{
          display: 'inline-block',
          padding: '20px 40px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          borderRadius: '20px',
          marginBottom: '30px',
          boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)'
        }}>
          <h1 style={{ 
            fontSize: '56px', 
            margin: '0',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>Big Boys Game</h1>
        </div>
        <p style={{ 
          fontSize: '24px', 
          margin: '0',
          opacity: '0.9',
          fontWeight: '300'
        }}>Elite Gaming Platform - Where Strategy Meets Excellence</p>
      </div>

      {/* Game Modes Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '30px', 
        maxWidth: '1200px',
        margin: '0 auto 60px'
      }}>
        {gameModes.map((mode) => (
          <div 
            key={mode.id}
            style={{ 
              padding: '30px', 
              background: selectedMode === mode.id 
                ? `linear-gradient(135deg, ${mode.color}, ${mode.color}80)`
                : 'rgba(51, 65, 85, 0.6)',
              borderRadius: '16px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: selectedMode === mode.id ? `2px solid ${mode.color}` : '2px solid transparent',
              backdropFilter: 'blur(10px)',
              transform: selectedMode === mode.id ? 'scale(1.05)' : 'scale(1)',
              boxShadow: selectedMode === mode.id 
                ? `0 20px 40px ${mode.color}40`
                : '0 10px 20px rgba(0,0,0,0.2)'
            }}
            onClick={() => setSelectedMode(selectedMode === mode.id ? null : mode.id)}
          >
            <h3 style={{ 
              fontSize: '24px', 
              marginBottom: '15px',
              color: selectedMode === mode.id ? 'white' : mode.color
            }}>{mode.title}</h3>
            <p style={{ 
              fontSize: '16px', 
              marginBottom: '20px',
              opacity: '0.9'
            }}>{mode.description}</p>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px' 
            }}>
              {mode.features.map((feature, index) => (
                <div key={index} style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ 
        textAlign: 'center',
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button style={{
          padding: '16px 32px',
          background: selectedMode 
            ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
            : 'linear-gradient(135deg, #374151, #4b5563)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: selectedMode ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease',
          opacity: selectedMode ? 1 : 0.6,
          boxShadow: selectedMode 
            ? '0 10px 20px rgba(59, 130, 246, 0.3)'
            : '0 5px 10px rgba(0,0,0,0.2)'
        }}>
          {selectedMode ? `Start ${gameModes.find(m => m.id === selectedMode)?.title}` : 'Select Game Mode'}
        </button>
        
        <button style={{
          padding: '16px 32px',
          background: 'transparent',
          color: '#3b82f6',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}>
          View Profile
        </button>
      </div>

      {/* Stats Footer */}
      <div style={{
        marginTop: '80px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '30px',
        maxWidth: '800px',
        margin: '80px auto 0'
      }}>
        {[
          { label: 'Active Players', value: '1,234' },
          { label: 'Games Played', value: '45,678' },
          { label: 'Elite Tournaments', value: '89' },
          { label: 'AI Opponents', value: '12' }
        ].map((stat, index) => (
          <div key={index} style={{
            textAlign: 'center',
            padding: '20px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#3b82f6',
              marginBottom: '8px'
            }}>{stat.value}</div>
            <div style={{
              fontSize: '16px',
              opacity: '0.8'
            }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}