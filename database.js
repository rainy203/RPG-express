import mongoose from "mongoose";
import 'dotenv/config'
mongoose.connect(process.env.MONGO_URI)
export const User = mongoose.model(
	"User",
	new mongoose.Schema(
		{
			_id: {
				type: String,
				required: true
			},
			username:{
				type: String,
				required: true,
				unique: true,
				
			},
			password: {
				type: String,
				required: true,
			},
			pfp:{
				type: String,
				required: true,
				default: "https://f005.backblazeb2.com/file/Twice-Typescript/1ba91456a866afec775a19851b336b46.webp"
				
			},
		
		
			
			

		
		},
		{ _id: false }
	)
);

export const Message = mongoose.model("Message", new mongoose.Schema({
    sender: {
        type: String,
        required: true,

    },
    recipient: {
        type: String,
        required: true,

    },
    content:{
        type: String,
        required: true,

    },
	role:{
		type: String,
		required: true
	},
    timeSent:{
        type:String,
        required: true,
        default: `${new Date().getMonth() + 1}/${new Date().getDate()}/${new Date().getFullYear()} - ${new Date().getHours()}:${new Date().getMinutes()}`
    },


}))

export const Convo = mongoose.model("Conversation", new mongoose.Schema({
	_id:{
type: String,
required: true
	},

	name:{
		type:String,
		required: true,
		default: "Untitled Conversation"
	},

   model: {
	type: String,
	required: true,
   },
   content: {
	type: Array,
	required: true,
   },
   createdBy:{
	type: String,
	required: true
   },
   type:{
	type:String,
	required: true

   },
   iventory:{
    type: String,
    required: true,
    default: " "
   },
   hp: {
    type: String,
    required: true,
    default: " "
   },
   xp:{
    type: String,
    required: true,
    default: " "
   },
   pfp:{
    type: String, 
    required: true,
    default: "https://f005.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_z44be58b3fd93f36c86c20d1f_f101ace2c95d4afd6_d20240224_m201711_c005_v0501017_t0010_u01708805830946"
   }

},
{ _id: false }))