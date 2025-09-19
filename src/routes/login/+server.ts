import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET() {
    const logoType = env.PUBLIC_LOGO || 'FLOWBACK';
    
    console.log(logoType, "LOGO");
    
    return json({
        logoType: logoType
    });
}
