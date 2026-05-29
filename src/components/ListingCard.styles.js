import styled from '@emotion/styled';
import { motion } from 'framer-motion';

export const CardWrapper = styled(motion.article)`
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: 16px;
  position: relative;
  transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  border: 1px solid var(--border-color);
  padding: 0;
  gap: 0px;
  z-index: 1;
  -webkit-touch-callout: none;
  cursor: pointer;

  /* Inset micro-border for glass/material edge highlight */
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 16px;
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.2);
    pointer-events: none;
    z-index: 2;
  }

  /* Physics-based hover states */
  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04);
  }

  .card-image-link {
    display: block;
    text-decoration: none;
    margin-bottom: 0;
  }

  .card-image-container {
    margin: -1px -1px 0 -1px;
    width: calc(100% + 2px);
    height: 220px;
    position: relative;
    overflow: hidden;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.03) 25%, rgba(0, 0, 0, 0.06) 50%, rgba(0, 0, 0, 0.03) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-bottom: 1px solid var(--border-color);
  }

  .card-image-main {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 1.2s cubic-bezier(0.33, 1, 0.68, 1);
    will-change: transform;
  }

  &:hover .card-image-main {
    transform: scale(1.08);
  }

  .card-content {
    padding: 10px 12px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: var(--bg-card);
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
  }

  .card-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
    margin-bottom: 0;
  }

  .card-address-link {
    text-decoration: none !important;
    color: inherit !important;
    display: block;
    min-width: 0;
    &:hover .card-address {
      text-decoration: underline !important;
      text-decoration-color: var(--text-secondary) !important;
    }
  }

  .card-address {
    font-family: inherit;
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    color: var(--text-primary);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .address-with-icon {
    display: flex;
    align-items: baseline;
    gap: 4px;
    min-width: 0;
    flex: 1;
    margin-right: 8px;
  }

  .card-price-row {
    font-size: 1.35rem;
    color: var(--text-primary);
    margin-bottom: 0px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .card-price-main {
    font-weight: 600;
    letter-spacing: -0.5px;
    font-variant-numeric: tabular-nums;
  }

  .card-valuation-row {
    font-size: 0.85rem;
    color: var(--text-tertiary);
    font-weight: 500;
  }

  .card-specs-row {
    display: flex;
    gap: 12px;
    font-size: 0.95rem;
    color: var(--text-secondary);
    font-weight: 400;
    margin-bottom: 8px;

    & > :not(:last-child)::after {
      content: "•";
      margin-left: 12px;
      opacity: 0.3;
    }
  }

  .card-footer-row {
    font-size: 0.85rem;
    color: var(--text-tertiary);
    margin-top: 0px;
  }

  /* Keep tooltip styles functional */
  .card-monthly-cost-row {
    font-size: 0.95rem;
    color: inherit;
    font-weight: 500;
    margin-bottom: 0px;
    position: relative;
    cursor: pointer;
    text-decoration: underline dotted;
    text-underline-offset: 4px;
    text-decoration-color: var(--text-tertiary);

    &:hover .cost-tooltip,
    &.tooltip-open .cost-tooltip {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
      visibility: visible;
    }
  }

  /* Favorite Button */
  .card-favorite-btn {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    margin: 0;
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 10;
    
    &.active {
      color: #ff4d4d;
      animation: fav-pop 0.3s ease;
    }
    &:hover {
      color: var(--text-primary);
      transform: scale(1.1);
    }
  }

  @keyframes fav-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
`;
