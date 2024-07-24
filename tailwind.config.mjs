/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			extend: {
				animation: {
				  'fade-in': 'fadeIn 0.5 ease-in-out forwards'
				},
				keyframes: {
				  fadeIn: {
					'0%': {
					  visibility: 'visible'
					},
					'100%': {
					  visibility: 'hidden'
					}
				  }
				}
			},
		},
	},
	plugins: [],
}
