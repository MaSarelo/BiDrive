import './AuctionDetails.css';

function AuctionDetailsSkeleton() {
    return (
        <div className="ad">
            {/* Breadcrumb Skeleton */}
            <div className="ad-breadcrumb">
                <div className="ad-container">
                    <span className="ad-skel ad-skel--text" style={{ width: '120px' }}></span>
                </div>
            </div>

            <main className="ad-container ad-body">

                {/* LEFT COL */}
                <div className="ad-left">
                    <div className="ad-title-block">
                        <div className="ad-title-block__top">
                            <span className="ad-skel ad-skel--status"></span>
                            <span className="ad-skel ad-skel--text" style={{ width: '100px' }}></span>
                        </div>
                        <h1 className="ad-title"><span className="ad-skel ad-skel--title"></span></h1>
                    </div>

                    <div className="ad-gallery">
                        <div className="ad-gallery__main">
                            <span className="ad-skel ad-skel--gallery"></span>
                        </div>
                        <div className="ad-gallery__thumbs" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                            {[1,2,3,4,5].map(i => <span key={i} className="ad-skel ad-skel--thumb"></span>)}
                        </div>
                    </div>

                    <div className="ad-specs">
                        <p className="ad-section-heading"><span className="ad-skel ad-skel--text" style={{ width: '250px' }}></span></p>
                        <div className="ad-specs__grid">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="ad-spec">
                                    <span className="ad-skel ad-skel--text" style={{ width: '70%', marginBottom: '12px' }}></span>
                                    <span className="ad-skel ad-skel--text" style={{ width: '50%' }}></span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="ad-seller">
                        <p className="ad-section-heading"><span className="ad-skel ad-skel--text" style={{ width: '100px' }}></span></p>
                        <span className="ad-skel ad-skel--text" style={{ width: '180px' }}></span>
                    </div>

                    <div className="ad-description">
                        <p className="ad-section-heading"><span className="ad-skel ad-skel--text" style={{ width: '100px' }}></span></p>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            <span className="ad-skel ad-skel--text" style={{ width: '100%' }}></span>
                            <span className="ad-skel ad-skel--text" style={{ width: '95%' }}></span>
                            <span className="ad-skel ad-skel--text" style={{ width: '60%' }}></span>
                        </div>
                    </div>
                </div>

                {/* SIDEBAR */}
                <aside className="ad-sidebar">
                    <div className="ad-price-card">
                        <div className="ad-price-card__top">
                            <p className="ad-price-card__eyebrow"><span className="ad-skel ad-skel--text" style={{width: '100px'}}></span></p>
                            <p className="ad-price-card__price"><span className="ad-skel ad-skel--price"></span></p>
                        </div>
                        <div className="ad-price-card__divider" />

                        <div className="ad-price-card__meta">
                            {[1,2,3].map(i => <span key={i} className="ad-skel ad-skel--meta"></span>)}
                        </div>

                        <div className="ad-price-card__divider" />

                        <div className="ad-bid-form">
                            <span className="ad-skel ad-skel--text" style={{ width: '100px', marginBottom: '15px' }}></span>
                            <span className="ad-skel ad-skel--btn"></span>
                        </div>
                    </div>
                </aside>

            </main>
        </div>
    );
}

export default AuctionDetailsSkeleton;