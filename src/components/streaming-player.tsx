'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface StreamingPlayerProps {
  streamUrl?: string;
  matchTitle?: string;
  className?: string;
}

export function StreamingPlayer({ streamUrl, matchTitle, className = '' }: StreamingPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (playerRef.current) {
      if (!isFullscreen) {
        if (playerRef.current.requestFullscreen) {
          playerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const openExternal = () => {
    if (streamUrl) {
      window.open(streamUrl, '_blank');
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleError = () => {
    setError('Failed to load stream. The stream may be offline or unavailable.');
  };

  if (!streamUrl) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
            <div className="text-center">
              <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No stream available for this match</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-0">
        <div ref={playerRef} className="relative bg-black rounded-lg overflow-hidden">
          {/* Video Player */}
          <div className="relative w-full h-64 md:h-96">
            {streamUrl.includes('twitch.tv') ? (
              // Twitch embed
              <iframe
                src={`https://player.twitch.tv/?channel=${streamUrl.split('/').pop()}&parent=localhost&parent=127.0.0.1&autoplay=false`}
                height="100%"
                width="100%"
                allowFullScreen
                className="w-full h-full"
              />
            ) : streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be') ? (
              // YouTube embed
              <iframe
                src={`https://www.youtube.com/embed/${streamUrl.split('v=')[1]?.split('&')[0] || streamUrl.split('youtu.be/')[1]?.split('?')[0]}`}
                height="100%"
                width="100%"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              // Generic video player
              <video
                ref={videoRef}
                src={streamUrl}
                className="w-full h-full object-cover"
                onError={handleError}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls={false}
              />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
              <div className="text-center text-white">
                <p className="text-lg font-semibold mb-2">Stream Unavailable</p>
                <p className="text-sm opacity-75">{error}</p>
                <Button 
                  onClick={openExternal}
                  className="mt-4"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Watch on External Site
                </Button>
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          {!streamUrl.includes('twitch.tv') && !streamUrl.includes('youtube.com') && !streamUrl.includes('youtu.be') && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={togglePlay}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    onClick={toggleMute}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-white bg-opacity-30 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={openExternal}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={toggleFullscreen}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Match Title */}
          {matchTitle && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded">
              <p className="text-sm font-medium">{matchTitle}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
