import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import styles from './ListingCard.module.css';

const ShimmerLine = styled.div`
  height: ${props => props.height || '16px'};
  width: ${props => props.width || '100%'};
  border-radius: ${props => props.radius || '8px'};
  margin-bottom: ${props => props.mb || '8px'};
  background: linear-gradient(90deg, rgba(0,0,0,0.03) 25%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.03) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const SkeletonCard = () => (
    <motion.article className={styles.cardWrapper} style={{ cursor: 'default' }}>
        <div className={styles.cardImageContainer} />
        <div className={styles.cardContent}>
            <ShimmerLine width="60%" height="20px" mb="12px" />
            <ShimmerLine width="40%" height="24px" mb="12px" />
            <div style={{ display: 'flex', gap: '12px' }}>
                <ShimmerLine width="20%" />
                <ShimmerLine width="20%" />
                <ShimmerLine width="20%" />
            </div>
            <ShimmerLine width="80%" height="12px" mt="4px" mb="0" />
        </div>
    </motion.article>
);

export default SkeletonCard;
