import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

const basePath = process.env.BASE_PATH || '';
const isDev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), mdsvex()],
	extensions: ['.svelte', '.svx'],
	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		paths: {
			base: isDev ? '' : basePath
		}
	}
};

export default config;
