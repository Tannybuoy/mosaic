import React, { useRef, useState } from 'react';
import { isValidImageFile } from '../utils/imageLoad';

interface UploadPanelProps {
  goalImage: File | null;
  tilePhotos: File[];
  onGoalImageChange: (file: File | null) => void;
  onTilePhotosChange: (files: File[]) => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({
  goalImage,
  tilePhotos,
  onGoalImageChange,
  onTilePhotosChange
}) => {
  const goalInputRef = useRef<HTMLInputElement>(null);
  const tilesInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState<'goal' | 'tiles' | null>(null);

  const handleGoalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file && isValidImageFile(file)) {
      onGoalImageChange(file);
    }
  };

  const handleTilesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const files = Array.from(e.dataTransfer.files).filter(isValidImageFile);
    if (files.length > 0 && files.length <= 10) {
      onTilePhotosChange(files);
    }
  };

  const handleGoalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidImageFile(file)) {
      onGoalImageChange(file);
    }
  };

  const handleTilesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(isValidImageFile);
    if (files.length > 0 && files.length <= 10) {
      onTilePhotosChange(files);
    }
  };

  const removeTile = (index: number) => {
    onTilePhotosChange(tilePhotos.filter((_, i) => i !== index));
  };

  return (
    <div className="upload-section">
      <h2>Upload Images</h2>
      
      {/* Goal Image Upload */}
      <div className="upload-group">
        <label>Goal Image (Required)</label>
        <div
          className={`dropzone ${dragOver === 'goal' ? 'drag-over' : ''} ${goalImage ? 'has-file' : ''}`}
          onDrop={handleGoalDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver('goal'); }}
          onDragLeave={() => setDragOver(null)}
          onClick={() => goalInputRef.current?.click()}
        >
          {goalImage ? (
            <div className="file-preview">
              <img src={URL.createObjectURL(goalImage)} alt="Goal" />
              <div className="file-info">
                <span className="file-name">{goalImage.name}</span>
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGoalImageChange(null);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div className="dropzone-content">
              <div className="upload-icon">📸</div>
              <p>Drop goal image or click to select</p>
              <span className="hint">JPG, PNG, WEBP</span>
            </div>
          )}
        </div>
        <input
          ref={goalInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleGoalFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Tile Photos Upload */}
      <div className="upload-group">
        <label>Tile Photos (1-10 Required)</label>
        <div
          className={`dropzone ${dragOver === 'tiles' ? 'drag-over' : ''} ${tilePhotos.length > 0 ? 'has-file' : ''}`}
          onDrop={handleTilesDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver('tiles'); }}
          onDragLeave={() => setDragOver(null)}
          onClick={() => tilesInputRef.current?.click()}
        >
          {tilePhotos.length > 0 ? (
            <div className="tiles-grid">
              {tilePhotos.map((file, i) => (
                <div key={i} className="tile-preview">
                  <img src={URL.createObjectURL(file)} alt={`Tile ${i + 1}`} />
                  <button
                    className="remove-btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTile(i);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {tilePhotos.length < 10 && (
                <div className="add-more">
                  <span>+ Add more</span>
                </div>
              )}
            </div>
          ) : (
            <div className="dropzone-content">
              <div className="upload-icon">🎨</div>
              <p>Drop 1-10 tile photos or click to select</p>
              <span className="hint">JPG, PNG, WEBP</span>
            </div>
          )}
        </div>
        <input
          ref={tilesInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handleTilesFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {tilePhotos.length > 10 && (
        <div className="error-message">
          Maximum 10 tile photos allowed. Please remove some.
        </div>
      )}
    </div>
  );
};
