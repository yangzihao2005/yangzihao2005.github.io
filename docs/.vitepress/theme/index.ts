import DefaultTheme from 'vitepress/theme'
import StudyLog from './components/StudyLog.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('StudyLog', StudyLog)
  },
}
