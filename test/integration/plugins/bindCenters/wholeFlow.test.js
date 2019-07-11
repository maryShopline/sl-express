require(process.cwd() + '/test/bootstrap.js')
const request = require('request-promise')
const AcknowledgmentCenter = require(`${libPath}/plugins/acknowledgmentCenter/lib/AcknowledgmentCenter.js`)
const NotificationCenter = require(`${libPath}/plugins/notificationCenter/lib/NotificationCenter.js`)
const bindCenters = require(`${libPath}/plugins/bindCenters/index.js`)

class TestSuite extends TestCombo {
  get title() {
    return 'bindCenters - whole flow'
  }

  get args() {
    return []
  }

  get argTypes() {
    return {}
  }

  filter(combination) {
    return true
  }

  extraCombinations() {
    return []
  }

  beforeAll(test, combination) {}

  beforeEach(test, combination) {
    test.targetRes = {}
    return this.runTest(test, combination)
  }

  afterAll(test, combination) {}

  afterEach(test, combination) {
    jest.restoreAllMocks()
  }

  getArgValues(test, combination, arg, argType) {}

  async testMethod(test, combination, argValues) {
    test.event = 'testing'
    test.payload = {}
    test.observer = {
      id: 'observerId',
      httpOpts: {
        uri: 'http://test.test'
      }
    }

    const acknowledgmentCenter = new AcknowledgmentCenter

    acknowledgmentCenter.register(test.event, test.observer)

    jest.spyOn(request, 'post').mockReturnValue(null)

    jest.spyOn(acknowledgmentCenter, 'enqueue').mockReturnValue(
      acknowledgmentCenter.dequeue({
        payload: {
          event: test.event,
          acknowledgmentObj: test.payload,
          observer: test.observer
        }
      })
    )

    const notificationCenter = new NotificationCenter

    bindCenters.prepare({
      config: {
        bindCenters: {
          events: [test.event]
        }
      },
      notificationCenter,
      acknowledgmentCenter
    })

    await notificationCenter.fire(test.event, test.payload)

    return
  }

  shouldSuccess(combination) {
    return true
  }

  successAssert(test, combination) {
    const [obj] = combination

    it('should call request.post with proper payload', function() {
      expect(request.post).toBeCalledWith(test.observer.httpOpts.uri, {
        ...test.observer.httpOpts,
        json: true,
        body: test.payload
      })
    })
  }

  failureAssert(test, combination) {}
}

const testSuite = new TestSuite()
testSuite.run()
