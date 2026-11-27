import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '../components/home-page'
import { buildHomeHead } from '../lib/home-head'
import { fetchSiteConfig } from '../server/site/site-config.fn'

export const Route = createFileRoute('/')({
  // Site config is read on the server and travels in loaderData, so the server
  // render and the hydrated client build the same head (never process.env here).
  loader: () => fetchSiteConfig(),
  head: ({ loaderData }) =>
    loaderData
      ? buildHomeHead(loaderData)
      : buildHomeHead({ siteUrl: null, indexable: false }),
  component: HomePage,
})
