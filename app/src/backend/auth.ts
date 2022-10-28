import axios from "axios";
import config from '../config'

export const getUser = async () => {
    return (await axios.get(`${config.API_BASE_URL}/profile`, {headers: { 'access-token': localStorage.getItem('access-token') || '' }})).data;
};

export const isLoggedIn = () => {
    return !!getUser();
}