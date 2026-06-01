import { useState, useEffect } from 'react';
import { getHandPickedImage } from '../../utils/apiUtils';

export function ArtistAvatar({ name, fallbackThumbnail }: { name: string; fallbackThumbnail: string }) {
  const handPicked = getHandPickedImage(name);
  const [imgUrl, setImgUrl] = useState(handPicked || fallbackThumbnail);

  useEffect(() => {
    if (handPicked) {
      setImgUrl(handPicked);
      return;
    }
    let active = true;
    const fetchRealImg = async () => {
      try {
        const cached = localStorage.getItem(`elva_artist_img_${name.toLowerCase()}`);
        if (cached) {
          setImgUrl(cached);
          return;
        }

        const res = await fetch(
          `https://corsproxy.io/?https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}`
        );
        if (res.ok) {
          const data = await res.json();
          const artist =
            (data.data || []).find((a: { name: string }) => a.name.toLowerCase() === name.toLowerCase()) ||
            data.data?.[0];
          if (artist && active && (artist.picture_medium || artist.picture_big)) {
            const url = artist.picture_medium || artist.picture_big;
            setImgUrl(url);
            localStorage.setItem(`elva_artist_img_${name.toLowerCase()}`, url);
            window.dispatchEvent(new CustomEvent('elva-artist-image-loaded', { detail: { name, url } }));
          }
        }
      } catch {
        // silent fallback
      }
    };

    fetchRealImg();
    return () => {
      active = false;
    };
  }, [name, fallbackThumbnail, handPicked]);

  return <img src={imgUrl} alt={name} className="w-full h-full object-cover rounded-full" />;
}
