// frontend/src/utils/dateUtils.js
import moment from 'moment-timezone';

export const formatDateTime = (dateStr) => {
    // Convert to EST
    return moment(dateStr).tz('America/New_York').format('MMMM D, YYYY h:mm A z');
};

export const convertToEST = (localDateTime) => {
    // Convert local input to EST for storing
    return moment(localDateTime).tz('America/New_York').format();
};