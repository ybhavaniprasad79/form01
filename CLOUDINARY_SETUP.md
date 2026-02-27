# Cloudinary Setup Guide

## 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account
3. Verify your email address

## 2. Get Your Credentials

1. After logging in, go to the Dashboard
2. You'll see your credentials in the "Account Details" section:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

## 3. Configure Backend

1. Open your `.env` file in the backend folder
2. Add these environment variables:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

3. Replace the values with your actual credentials from step 2

## 4. How It Works

### Upload Flow:
1. User selects receipt file in the frontend
2. When they click "Complete Registration":
   - File is uploaded to Cloudinary first
   - Cloudinary returns a secure URL
   - Form is submitted with the URL
   - URL is saved in MongoDB

### Storage:
- Receipts are stored in Cloudinary folder: `team-registrations/receipts`
- Each file gets a unique public ID
- Files are accessible via secure HTTPS URLs
- Cloudinary handles image optimization automatically

### Viewing Receipts:
- Admin can view receipts in the Download page by clicking "View Receipt"
- Receipt URLs are also included in the Excel export
- URLs are permanent and can be shared

## 5. Cloudinary Free Tier Limits

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- This is sufficient for thousands of team registrations

## 6. Testing

1. Restart your backend server after adding environment variables
2. Restart your frontend
3. Fill out a test registration with a sample receipt image
4. Check the admin panel to see the "View Receipt" link
5. Click the link to verify the image loads from Cloudinary

## 7. Troubleshooting

**Upload fails:**
- Check your Cloudinary credentials in `.env`
- Ensure file size is under 5MB
- Verify file format is image or PDF

**Receipt not showing:**
- Check browser console for errors
- Verify the receipt URL was saved in the database
- Test the Cloudinary URL directly in browser

## Optional: Folder Organization

You can customize the Cloudinary folder structure in `backend/cloudinary.js`:

```javascript
folder: 'team-registrations/receipts'  // Change this to your preferred folder
```

## Security Notes

- ✅ Cloudinary URLs are signed and secure
- ✅ API credentials are stored in environment variables (not in code)
- ✅ File upload is limited to images and PDFs only
- ✅ 5MB file size limit prevents abuse
- ✅ Only authenticated admins can view receipts through the admin panel
