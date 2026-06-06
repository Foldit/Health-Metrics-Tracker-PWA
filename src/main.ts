import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
	Button,
	Cell,
	CellGroup,
	Dialog,
	DatePicker,
	Form,
	Field,
	Grid,
	GridItem,
	NavBar,
	Popup,
	Radio,
	RadioGroup,
	Tab,
	Tabbar,
	TabbarItem,
	Tabs,
	Tag,
	TimePicker,
} from 'vant'
import 'vant/lib/index.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { registerSW } from './pwa/register'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app
	.use(Button)
	.use(Cell)
	.use(CellGroup)
	.use(Form)
	.use(Field)
	.use(DatePicker)
	.use(Grid)
	.use(GridItem)
	.use(NavBar)
	.use(Popup)
	.use(Radio)
	.use(RadioGroup)
	.use(Tab)
	.use(Tabbar)
	.use(TabbarItem)
	.use(Tabs)
	.use(Tag)
	.use(TimePicker)
	.use(Dialog)

app.mount('#app')

registerSW()
