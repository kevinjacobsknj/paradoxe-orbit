import React from 'react';
import LiquidLogo from './LiquidLogo.js';

/**
 * Demo component showing different liquid effect variations
 * for the Paradoxe Orbit logo
 */
export default function LogoDemo() {
  return (
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '40px'
    }}>
      <h1 style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        color: '#333',
        marginBottom: '20px' 
      }}>
        Paradoxe Orbit - Liquid Logo Effects
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
        width: '100%',
        maxWidth: '1200px'
      }}>
        
        {/* Default Effect */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '15px', color: '#555' }}>Default Effect</h3>
          <LiquidLogo 
            src="./assets/logomain.png"
            size={200}
          />
        </div>

        {/* Subtle Effect */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '15px', color: '#555' }}>Subtle Refraction</h3>
          <LiquidLogo 
            src="./assets/logomain.png"
            size={200}
            refraction={0.01}
            speed={8}
          />
        </div>

        {/* Intense Effect */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '15px', color: '#555' }}>Intense Liquid</h3>
          <LiquidLogo 
            src="./assets/logomain.png"
            size={200}
            refraction={0.04}
            patternScale={1.5}
            speed={4}
          />
        </div>

        {/* Slow Ripple */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '15px', color: '#555' }}>Slow Ripple</h3>
          <LiquidLogo 
            src="./assets/logomain.png"
            size={200}
            refraction={0.025}
            patternScale={3}
            speed={10}
            patternBlur={1}
          />
        </div>

        {/* Still Version */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '15px', color: '#555' }}>Static Distortion</h3>
          <LiquidLogo 
            src="./assets/logomain.png"
            size={200}
            refraction={0.03}
            still={true}
          />
        </div>

        {/* Large Size */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '15px', color: '#555' }}>Large Format</h3>
          <LiquidLogo 
            src="./assets/logomain.png"
            size={280}
            refraction={0.015}
            patternScale={2.5}
            speed={7}
          />
        </div>

      </div>

      {/* Usage Example */}
      <div style={{ 
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '800px'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>Usage Examples:</h3>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          overflow: 'auto',
          fontSize: '14px'
        }}>
{`import LiquidLogo from './components/LiquidLogo.js';

// Basic usage
<LiquidLogo src="./assets/logomain.png" />

// Customized effect
<LiquidLogo 
  src="./assets/logomain.png"
  size={300}
  refraction={0.025}
  patternScale={2}
  speed={6}
  className="my-logo"
/>

// Static version (no animation)
<LiquidLogo 
  src="./assets/logomain.png"
  still={true}
  refraction={0.02}
/>`}
        </pre>
      </div>
    </div>
  );
}