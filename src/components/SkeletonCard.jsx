/**
 * Skeleton loading card for listing placeholders
 */
const SkeletonCard = () => (
    <article className="skeleton-card">
        {/* Header / Address */}
        <div className="skeleton-header"></div>

        {/* Hero Metric */}
        <div className="skeleton-hero"></div>

        {/* Secondary Metrics (2 cols) */}
        <div className="skeleton-metrics">
            <div className="skeleton-metric"></div>
            <div className="skeleton-metric"></div>
        </div>

        {/* Commute (Optional) */}
        <div className="skeleton-commute"></div>
    </article>
);

export default SkeletonCard;
