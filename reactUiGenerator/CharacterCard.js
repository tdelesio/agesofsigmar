
import React, { useState } from 'react';
import WeaponStats from './WeaponStats';
import styles from '../styles/CharacterCard.module.css';

const CharacterCard = () => {
  const [isRedBackground, setIsRedBackground] = useState(false);

  const handleBackgroundClick = () => {
    setIsRedBackground(!isRedBackground);
  };

  return (
    <div 
      className={`${styles.card} ${isRedBackground ? styles.redBackground : ''}`} 
      onClick={handleBackgroundClick}
    >
      <h2 className={styles.title}>Blood Knight</h2>
      <p className={styles.subtitle}>(Calvary) (Vampire) (Ward(6+))</p>
      
      <div className={styles.stats}>
        <span>Health: 3</span>
        <span>Save: 3+</span>
        <span>Ward: 6+</span>
      </div>

      <WeaponStats
        name="Templar Lance/Sword"
        attacks={3}
        hit="3+"
        wound="3+"
        rend={1}
        damage={1}
        ability="Charge (+1 Damage)"
      />

      <WeaponStats
        name="Nightmare's Hooves and Teeth"
        attacks={3}
        hit="5+"
        wound="3+"
        rend={0}
        damage={1}
        ability="companion"
      />

      <div className={styles.riderOfRuin}>
        <h3>Rider of Ruin</h3>
        <p>Models in this unit can pass across enemy infantry models as if this unit had FLY.</p>
      </div>
    </div>
  );
};

export default CharacterCard;
