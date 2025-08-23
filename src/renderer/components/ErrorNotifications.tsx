import React, { useState, useEffect } from "react";
import { errorService, AppError, ErrorLevel } from "../services/ErrorService";

interface NotificationItemProps {
  error: AppError;
  onClose: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ error, onClose }) => {
  const getIcon = (level: ErrorLevel) => {
    switch (level) {
      case ErrorLevel.INFO:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
        );
      case ErrorLevel.WARNING:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
            <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
          </svg>
        );
      case ErrorLevel.ERROR:
      case ErrorLevel.CRITICAL:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getColors = (level: ErrorLevel) => {
    switch (level) {
      case ErrorLevel.INFO:
        return "bg-blue-50 border-blue-200 text-blue-800";
      case ErrorLevel.WARNING:
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case ErrorLevel.ERROR:
        return "bg-red-50 border-red-200 text-red-800";
      case ErrorLevel.CRITICAL:
        return "bg-red-100 border-red-300 text-red-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${getColors(error.level)} shadow-sm animate-slideIn`}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon(error.level)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{error.userMessage}</p>
        {error.details && (
          <p className="text-xs opacity-75 mt-1 font-mono">{error.details}</p>
        )}
      </div>
      <button
        onClick={() => onClose(error.id)}
        className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>
    </div>
  );
};

export const ErrorNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AppError[]>([]);

  useEffect(() => {
    const handleError = (error: AppError) => {
      setNotifications(prev => [error, ...prev.slice(0, 4)]); // Keep max 5 notifications
    };

    const handleErrorCleared = (errorId: string) => {
      setNotifications(prev => prev.filter(n => n.id !== errorId));
    };

    errorService.setCallbacks({
      onError: handleError,
      onErrorCleared: handleErrorCleared,
    });

    return () => {
      errorService.setCallbacks({});
    };
  }, []);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-w-sm space-y-2">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          error={notification}
          onClose={(id) => errorService.clearError(id)}
        />
      ))}
    </div>
  );
};