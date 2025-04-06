import React from 'react';
import styles from './ImpermanentLossExplainer.module.scss';
import { getImpermanentLossTooltip } from '../../utils/tooltipContent';
import InfoIcon from '../common/InfoIcon';

/**
 * A component that explains impermanent loss with interactive elements
 */
const ImpermanentLossExplainer = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Understanding Impermanent Loss</h3>
        <p className={styles.subtitle}>
          An important concept for liquidity providers
        </p>
      </div>
      
      <div className={styles.content}>
        <div className={styles.definition}>
          <h4>What is Impermanent Loss?</h4>
          <p>
            Impermanent loss occurs when the price of your tokens changes compared 
            to when you deposited them in the liquidity pool. The more volatile the 
            trading pair, the higher the risk of impermanent loss.
          </p>
          <div className={styles.infoParagraph}> 
            <InfoIcon 
              content={getImpermanentLossTooltip()} 
              position="right" 
              size="medium" 
            />
            <span className={styles.infoText}>
              Click the info icon for more details
            </span>
          </div>
        </div>
        
        <div className={styles.visual}>
          <div className={styles.exampleCard}>
            <h4>Example Scenario</h4>
            <div className={styles.scenario}>
              <p><strong>Initial deposit:</strong> You deposit equal value of Token A and Token B</p>
              <ul>
                <li>100 Token A at $1 each = $100</li>
                <li>100 Token B at $1 each = $100</li>
                <li>Total value: $200</li>
              </ul>
              
              <div className={styles.scenarioArrow}>↓</div>
              
              <p><strong>Price change:</strong> Token A price increases by 50%</p>
              <ul>
                <li>Token A is now worth $1.50</li>
                <li>Token B remains at $1</li>
              </ul>
              
              <div className={styles.scenarioArrow}>↓</div>
              
              <p><strong>Result:</strong></p>
              <div className={styles.result}>
                <div className={styles.resultColumn}>
                  <div className={styles.resultHeading}>If you HODL</div>
                  <ul>
                    <li>100 Token A at $1.50 = $150</li>
                    <li>100 Token B at $1 = $100</li>
                    <li>Total value: $250</li>
                  </ul>
                </div>
                
                <div className={styles.resultColumn}>
                  <div className={styles.resultHeading}>From Liquidity Pool</div>
                  <ul>
                    <li>81.65 Token A at $1.50 = $122.47</li>
                    <li>122.47 Token B at $1 = $122.47</li>
                    <li>Total value: $244.94</li>
                  </ul>
                </div>
              </div>
              
              <div className={styles.lossCalculation}>
                <p className={styles.lossAmount}>
                  <strong>Impermanent Loss: $5.06 (2.02%)</strong>
                </p>
                <p className={styles.lossDescription}>
                  This loss is "impermanent" because it only becomes realized when you withdraw.
                  If prices return to the original ratio, the loss disappears.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.mitigationStrategies}>
          <h4>Mitigating Impermanent Loss</h4>
          <ul>
            <li>
              <strong>Provide liquidity to stable pairs</strong> - Tokens with correlated prices (like stablecoin pairs) experience less impermanent loss
            </li>
            <li>
              <strong>Consider the fee income</strong> - High trading volume can offset impermanent loss through fee income
            </li>
            <li>
              <strong>Check the volatility rating</strong> - Our pool cards show volatility ratings to help you assess risk
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImpermanentLossExplainer; 