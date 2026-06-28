import { useEffect, useState } from 'react';

export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useToday = () => {
  const [today, setToday] = useState(() => getLocalDateString());

  useEffect(() => {
    const updateToday = () => setToday(getLocalDateString());
    updateToday();
    const timer = window.setInterval(updateToday, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return today;
};
