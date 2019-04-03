import * as got from 'got';

const searchParams = { v: 1, tid: 'UA-137490130-1', cid: 555, t: 'pageview', dp: '/home' };

got.post('https://www.google-analytics.com/collect', { form: true, body: searchParams }).catch(e =>
    console.log(e)
);
