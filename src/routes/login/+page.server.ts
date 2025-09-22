import { LOGO } from '$env/static/private';
import Logo from '$lib/assets/Logo.png';
import Reforum from '$lib/assets/ReforumTransparent.png';

export function load() {
    const logoType = LOGO === 'REFORUM' ? Reforum : Logo

    return {
        logoType
    };
}
