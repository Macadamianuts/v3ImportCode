// 调度定义
let queue = []
let isFlushPending = false // 是否有微任务执行
let currentFlushPromise = null // 正在执行的微任务
let resolvePromise = Promise.resolve() // 调用微任务

// quenueJob
export const queueJob = job => {
    // 入队 去重
    if (!queue.includes(job)) {
        queue.push(job)
        quenuFlush()
    }
}

// quenuFlush 
const quenuFlush = () => {
    if(!isFlushPending) {
        isFlushPending = true;
        currentFlushPromise = resolvePromise.then(flushJobs)
    }
}

// flushJobs
const flushJobs = async () => {
    try {
        for(const job of queue) {
           await job()
        }
    } finally {
        // 还原操作
        isFlushPending = false
        queue.length = 0
        currentFlushPromise = null
    }
}
