import './AuctionCard.css';

function AuctionCardSkeleton() {
    return (
        <div className="ac-link" aria-hidden="true">
            <article className="ac" role="presentation">
                {/* Photo Skeleton */}
                <div className="ac-photo">
                    <span className="skeleton skeleton--photo"></span>
                </div>

                {/* Body Skeleton */}
                <div className="ac-body">
                    <h2 className="ac-title">
                        <span className="skeleton skeleton--title"></span>
                    </h2>

                    <div className="ac-specs">
                        <div className="ac-spec">
                            <span className="skeleton skeleton--spec"></span>
                        </div>
                        <div className="ac-spec">
                            <span className="skeleton skeleton--spec"></span>
                        </div>
                        <div className="ac-spec">
                            <span className="skeleton skeleton--spec"></span>
                        </div>
                        <div className="ac-spec">
                            <span className="skeleton skeleton--spec"></span>
                        </div>
                    </div>
                </div>

                {/* Footer Skeleton */}
                <div className="ac-footer">
                    <div className="ac-footer__divider" aria-hidden="true" />
                    <div className="ac-footer__inner">
                        <div>
                            <p className="ac-price__value">
                                <span className="skeleton skeleton--price"></span>
                            </p>
                            <p className="ac-end-time">
                                <span className="skeleton skeleton--time"></span>
                            </p>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    );
}

export default AuctionCardSkeleton;