export default function getHighResImageUrl(thumbnailUrl: string): string {
    // Convert thumbnail URL to high-res URL
    return thumbnailUrl.replace(/_SR38,50_|._SS40_|._AC_US40_/g, '_SL1500_');
}