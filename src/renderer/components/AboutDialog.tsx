import React from "react";
import { InfoIcon, CloseIcon } from "./icons/IconLibrary";

interface AboutDialogProps {
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-vscode-bg-secondary rounded-md shadow-2xl w-96 border border-vscode-border">
        <div className="px-6 py-4 border-b border-vscode-border flex justify-between items-center bg-vscode-bg-tertiary">
          <div className="flex items-center space-x-2">
            <InfoIcon className="w-5 h-5 text-vscode-blue" />
            <h2 className="text-lg font-medium text-vscode-text">
              About SQLTemple
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-vscode-text-secondary hover:text-vscode-text transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-vscode-blue bg-opacity-20 rounded-full flex items-center justify-center">
              <InfoIcon className="w-8 h-8 text-vscode-blue" />
            </div>
            <h3 className="text-2xl font-bold text-vscode-text mb-2">
              SQLTemple
            </h3>
            <p className="text-vscode-text-secondary">
              A modern SQL database client
            </p>
          </div>

          <div className="space-y-2 text-sm text-vscode-text-secondary">
            <p>Version 1.0.0</p>
            <p>Built with Electron and React</p>
            <p>© 2024 SQLTemple</p>
          </div>

          <div className="mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-vscode-blue hover:bg-vscode-blue-light text-white rounded text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
