import React, { useState } from "react";
import styled from "styled-components";

type UploadFileProps = {
  onFileSelect?: (file: File | null) => void;
  accept?: string;
  label?: string;
  description?: string;
  buttonText?: string;
  className?: string;
};

export default function UploadFile({
  onFileSelect,
  accept = "image/*,video/*",
  label = "Upload file",
  description = "PNG, JPG, GIF, MP4, WEBM",
  buttonText = "Browse file",
  className,
}: UploadFileProps) {
  const [selectedName, setSelectedName] = useState("");
  const inputId = React.useId();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedName(file?.name ?? "");
    onFileSelect?.(file);
  }

  return (
    <StyledWrapper className={className}>
      <label htmlFor={inputId} className="file-upload-label">
        <div className="file-upload-design">
          <svg viewBox="0 0 640 512" height="1em" aria-hidden="true">
            <path d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-217c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V392c0 13.3 10.7 24 24 24s24-10.7 24-24V257.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0l-80 80z" />
          </svg>
          <p className="title">{label}</p>
          <p className="subtitle">{description}</p>
          <span className="browse-button">{buttonText}</span>
          {selectedName ? <span className="selected-file">{selectedName}</span> : null}
        </div>
        <input id={inputId} type="file" accept={accept} onChange={handleChange} />
      </label>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  width: 100%;

  .file-upload-label input {
    display: none;
  }

  .file-upload-label svg {
    height: 36px;
    fill: #a1a1aa;
    margin-bottom: 8px;
  }

  .file-upload-label {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: transparent;
    padding: 16px;
    border-radius: 8px;
    border: 1px dashed #3f4328;
    color: #ffffff;
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }

  .file-upload-label:hover {
    border-color: #ffffff;
    background-color: #3f4328;
  }

  .file-upload-design {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    text-align: center;
  }

  .title {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0;
  }

  .subtitle {
    font-size: 0.75rem;
    color: #71717a;
    margin: 0;
  }

  .browse-button {
    margin-top: 4px;
    background-color: #3f4328;
    padding: 6px 12px;
    border-radius: 999px;
    color: #fff;
    font-size: 0.8rem;
    font-weight: 500;
    transition: background-color 0.2s ease;
  }

  .browse-button:hover {
    background-color: #121212;
  }

  .selected-file {
    font-size: 0.75rem;
    color: #52525b;
    margin-top: 2px;
  }
`;
