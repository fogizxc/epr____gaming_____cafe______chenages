import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import { Booking, GamingServiceCategory } from '../../types';
import {
  Calendar,
  QrCode,
  CheckCircle2,
  Clock,
  X,
  PlusCircle,
  AlertCircle,
  Repeat,
  Trash2,
  Tv,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { OPERATING_TIME_SLOTS } from '../../services/operatingHours';
