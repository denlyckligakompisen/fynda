import re

file_path = 'src/components/ListingCard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add state for imageIndex
if 'const [imageIndex, setImageIndex] = useState(0);' not in content:
    content = content.replace(
        "const ListingCard = memo(({ item, isFavorite, toggleFavorite, alwaysShowFavorite, variant = 'list' }) => {",
        "const ListingCard = memo(({ item, isFavorite, toggleFavorite, alwaysShowFavorite, variant = 'list' }) => {\n    const [imageIndex, setImageIndex] = useState(0);\n    const images = item.images && item.images.length > 0 ? item.images : [item.imageUrl];"
    )

# Add next/prev handlers
if 'const nextImage' not in content:
    handlers = """
    const nextImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (imageIndex < images.length - 1) {
            setImageIndex(imageIndex + 1);
        }
    };

    const prevImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (imageIndex > 0) {
            setImageIndex(imageIndex - 1);
        }
    };
    """
    content = content.replace(
        "    const [imageIndex, setImageIndex] = useState(0);\n    const images = item.images && item.images.length > 0 ? item.images : [item.imageUrl];",
        "    const [imageIndex, setImageIndex] = useState(0);\n    const images = item.images && item.images.length > 0 ? item.images : [item.imageUrl];\n" + handlers
    )

# Replace rendering logic
old_render = """                        {(() => {
                            const baseUrl = item.imageUrl?.split('_')[0]; // Get everything before the size suffix
                            if (!baseUrl || !item.imageUrl.includes('bcdn.se')) {
                                return <img src={item.imageUrl || '/placeholder.png'} alt={item.address} className="card-image-main" loading="lazy" decoding="async" referrerPolicy="no-referrer" />;
                            }

                            // Professional web way: responsive sizes
                            const src400 = `${baseUrl}_400x300.jpg`;
                            const src800 = `${baseUrl}_800x600.jpg`;
                            const srcDefault = `${baseUrl}_800x600.jpg`; // Standard fallback

                            return (
                                <SmartImage
                                    src={srcDefault}
                                    srcSet={`${src400} 400w, ${src800} 800w`}
                                    sizes="(max-width: 600px) 400px, 800px"
                                    alt={item.address}
                                    className="card-image-main"
                                />
                            );
                        })()}"""

new_render = """                        {(() => {
                            const currentUrl = images[imageIndex] || item.imageUrl;
                            const baseUrl = currentUrl?.split('_')[0]; // Get everything before the size suffix
                            
                            let imgComponent;
                            if (!baseUrl || !currentUrl?.includes('bcdn.se')) {
                                imgComponent = <img src={currentUrl || '/placeholder.png'} alt={item.address} className="card-image-main" loading="lazy" decoding="async" referrerPolicy="no-referrer" />;
                            } else {
                                // Professional web way: responsive sizes
                                const src400 = `${baseUrl}_400x300.jpg`;
                                const src800 = `${baseUrl}_800x600.jpg`;
                                const srcDefault = `${baseUrl}_800x600.jpg`; // Standard fallback

                                imgComponent = (
                                    <SmartImage
                                        src={srcDefault}
                                        srcSet={`${src400} 400w, ${src800} 800w`}
                                        sizes="(max-width: 600px) 400px, 800px"
                                        alt={item.address}
                                        className="card-image-main"
                                    />
                                );
                            }
                            
                            return (
                                <>
                                    {imgComponent}
                                    {images.length > 1 && (
                                        <>
                                            {imageIndex > 0 && (
                                                <div className="carousel-btn prev" onClick={prevImage}>
                                                    <ChevronLeftRoundedIcon />
                                                </div>
                                            )}
                                            {imageIndex < images.length - 1 && (
                                                <div className="carousel-btn next" onClick={nextImage}>
                                                    <ChevronRightRoundedIcon />
                                                </div>
                                            )}
                                            <div className="carousel-dots">
                                                {images.map((_, idx) => (
                                                    <span key={idx} className={`carousel-dot ${idx === imageIndex ? 'active' : ''}`} />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            );
                        })()}"""

if old_render in content:
    content = content.replace(old_render, new_render)
else:
    print("WARNING: Could not find old render logic!")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ListingCard.jsx updated.")
