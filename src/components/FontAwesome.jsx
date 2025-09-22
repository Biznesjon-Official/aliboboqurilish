// FontAwesome React wrapper component
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Wrapper component for easier usage
export const FAIcon = ({ icon, className, ...props }) => (
  <FontAwesomeIcon icon={icon} className={className} {...props} />
);

// Common icon components for easier usage
export const SearchFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="search" className={className} {...props} />
);

export const CartFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="shopping-cart" className={className} {...props} />
);

export const UserFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="user" className={className} {...props} />
);

export const UsersFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="users" className={className} {...props} />
);

export const HeartFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="heart" className={className} {...props} />
);

export const StarFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="star" className={className} {...props} />
);

export const PlusFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="plus" className={className} {...props} />
);

export const MinusFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="minus" className={className} {...props} />
);

export const TrashFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="trash" className={className} {...props} />
);

export const EditFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="edit" className={className} {...props} />
);

export const EyeFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="eye" className={className} {...props} />
);

export const TimesFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="times" className={className} {...props} />
);

export const CheckFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="check" className={className} {...props} />
);

export const ChevronLeftFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="chevron-left" className={className} {...props} />
);

export const ChevronRightFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="chevron-right" className={className} {...props} />
);

export const ChevronDownFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="chevron-down" className={className} {...props} />
);

export const ChevronUpFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="chevron-up" className={className} {...props} />
);

export const BarsFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="bars" className={className} {...props} />
);

export const HomeFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="home" className={className} {...props} />
);

export const PhoneFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="phone" className={className} {...props} />
);

export const EnvelopeFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="envelope" className={className} {...props} />
);

export const MapMarkerAltFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="map-marker-alt" className={className} {...props} />
);

export const FilterFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="filter" className={className} {...props} />
);

export const SortFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="sort" className={className} {...props} />
);

export const SpinnerFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="spinner" className={`${className} fa-spin`} {...props} />
);

// Additional commonly used icons
export const TruckFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="truck" className={className} {...props} />
);

export const ShieldAltFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="shield-alt" className={className} {...props} />
);

export const HeadsetFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="headset" className={className} {...props} />
);

export const ThLargeFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="th-large" className={className} {...props} />
);

export const InboxFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="inbox" className={className} {...props} />
);

export const RotateLeftFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="rotate-left" className={className} {...props} />
);

export const LayerGroupFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="layer-group" className={className} {...props} />
);

// Brand icons
export const FacebookFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon={["fab", "facebook-f"]} className={className} {...props} />
);

export const InstagramFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon={["fab", "instagram"]} className={className} {...props} />
);

export const TelegramPlaneFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon={["fab", "telegram-plane"]} className={className} {...props} />
);

export const BellFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="bell" className={className} {...props} />
);

export const CogFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="cog" className={className} {...props} />
);

export const HammerFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="hammer" className={className} {...props} />
);

export const ToolsFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="tools" className={className} {...props} />
);

export const UploadFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="upload" className={className} {...props} />
);

export const ImageFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="image" className={className} {...props} />
);

export const ImagesFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="images" className={className} {...props} />
);

export const TagFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="tag" className={className} {...props} />
);

export const BoxFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="box" className={className} {...props} />
);

export const ChartBarFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="chart-bar" className={className} {...props} />
);

export const MoneyBillWaveFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="money-bill-wave" className={className} {...props} />
);

export const ExclamationTriangleFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="exclamation-triangle" className={className} {...props} />
);

export const InfoCircleFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="info-circle" className={className} {...props} />
);

export const CheckCircleFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="check-circle" className={className} {...props} />
);

export const TimesCircleFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="times-circle" className={className} {...props} />
);

export const GraduationCapFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="graduation-cap" className={className} {...props} />
);

export const ChartLineFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="chart-line" className={className} {...props} />
);

export const QuestionCircleFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="question-circle" className={className} {...props} />
);

export const ClockFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="clock" className={className} {...props} />
);

export const SignOutAltFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="sign-out-alt" className={className} {...props} />
);

export const ArrowUpFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="arrow-up" className={className} {...props} />
);

export const ArrowDownFAIcon = ({ className, ...props }) => (
  <FontAwesomeIcon icon="arrow-down" className={className} {...props} />
);

export default FAIcon;
