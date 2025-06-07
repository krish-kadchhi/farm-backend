const {v2 : cloudinary} = require('cloudinary');
const fs = require('fs');

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (loclafilepath) => {
    try{
        if(!loclafilepath) return null;

        const response = await cloudinary.uploader.upload(loclafilepath, {
            resource_type: "auto",
        })

        // console.log("file is uploaded", response.url);
        fs.unlinkSync(loclafilepath);
        return response;
    }catch(error){
        fs.unlinkSync(loclafilepath);
        return null;
    }
}

module.exports = uploadOnCloudinary;
