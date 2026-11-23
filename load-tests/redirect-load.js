import redirect from "./redirect-smoke.js"

function makeOptions({ vus, duration }) {
  if (!Number.isInteger(vus) || vus < 1) {
    throw new Error('TEST_VUS must be a positive whole number')
  }

  return {
    vus,
    duration,
    thresholds: {
      checks: ['rate==1'],
    },
  }
}

export const options=makeOptions({
  vus: Number(__ENV.VUS??'5'),
  duration: __ENV.DURATION??'90s',
})

export default redirect