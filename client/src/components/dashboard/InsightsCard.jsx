import { useState, useEffect } from 'react';
import { expenseService } from '../../services/dataService';
import { HiOutlineLightBulb, HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineTrendingUp } from 'react-icons/hi';
import './InsightsCard.css';

const InsightsCard = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const { data } = await expenseService.getInsights();
      setInsights(data.data.insights || []);
    } catch (err) {
      console.error('Insights fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (insights.length <= 1) return;
    
    // Auto cycle carousel every 8 seconds
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % insights.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [insights]);

  if (loading) {
    return (
      <div className="insights-card glass-card--static flex items-center justify-center" style={{ minHeight: '120px' }}>
        <div className="spinner spinner--sm" />
      </div>
    );
  }

  if (insights.length === 0) return null;

  const current = insights[activeSlide];

  const getIcon = (type) => {
    switch (type) {
      case 'danger': return <HiOutlineExclamation className="insights-card__icon text-danger" />;
      case 'warning': return <HiOutlineExclamation className="insights-card__icon text-warning" />;
      case 'info': return <HiOutlineTrendingUp className="insights-card__icon text-info" />;
      case 'success': return <HiOutlineCheckCircle className="insights-card__icon text-success" />;
      default: return <HiOutlineLightBulb className="insights-card__icon text-info" />;
    }
  };

  return (
    <div className={`insights-card glass-card insights-card--${current.type || 'info'}`}>
      <div className="insights-card__container">
        {getIcon(current.type)}
        <div className="insights-card__content">
          <h4 className="insights-card__title">{current.title}</h4>
          <p className="insights-card__message">{current.message}</p>
        </div>
      </div>

      {insights.length > 1 && (
        <div className="insights-card__dots">
          {insights.map((_, index) => (
            <button
              key={index}
              className={`insights-card__dot ${index === activeSlide ? 'insights-card__dot--active' : ''}`}
              onClick={() => setActiveSlide(index)}
              title={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightsCard;
