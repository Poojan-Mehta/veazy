<?php
$lang = array();
///////////// Menu Translation Line ///////////////////////////
$lang['menu'] = [
    'home' => 'Home',
    'my_application' => 'My Applications',
    'add_application' => 'Add Application',
    'master_dashboard_profeatures' => 'PRO-FEATURES',
    'all_tasks' => 'All Tasks',
    'quick_links' => 'Quick Links',
    'support' => 'Support',
    'myprofile' => 'My Profile',
    'logout' => 'Log Out',
    'plan' => 'Plans',
    'bill' => 'Billing And Upgrade',
    'product_dashboard' => 'Dashboard',
    'product_sidebar_step1' => 'STEP 1 - LEARN', /*STEP 1 - DISCOVER*/
    'product_sidebar_step2' => 'STEP 2 - PREPARE',
    'product_sidebar_step3' => 'STEP 3 - SUBMIT',
    'product_lesson'=> 'Lessons',
    'product_soc'=> 'Summary of Criteria',
    'product_dc' => 'Document Checklist',
    'product_todo' => 'Final To Do',
    'product_coverletter' => 'Cover Letter',
    'product_faq' => 'FAQ',
    'product_profeatures' => 'PRO-FEATURES',
    'product_tasks' => 'Tasks',
    'product_notes' => 'Notes',
];

///////////// My Profile Translation Line ///////////////////////////
$lang['profile'] = [
    'header' => 'Account',
    'personal_info' => 'Personal Info',
    'change_avatar' => 'Change Avatar',
    'change_password' => 'Change Password',
    'personal_info_first_name' => 'First Name',
    'personal_info_first_name_required' => 'First Name is required',
    'personal_info_last_name' => 'Last Name',
    'personal_info_last_name_required' => 'Last Name is required',
    'personal_info_email' => 'Email',
    'personal_info_email_required' => 'Email is required',
    'personal_info_email_invalid' => 'Email is invalid',
    'personal_info_gender' => 'Gender',
    'personal_info_gender_required' => 'Gender is required',
    'personal_info_gender_select' => 'Select Gender',
    'personal_info_gender_male' => 'Male',
    'personal_info_gender_female' => 'Female',
    'personal_info_save_btn' => 'Save Changes',
    'change_avatar_note' => 'NOTE!',
    'change_avatar_select_image' => 'Select Image',
    'change_avatar_change_image' => 'Change',
    'change_avatar_note_message' => 'Only PNG or JPG format and less than 1 MB.',
    'change_avatar_submit' => 'Submit',
    'change_password_current_password' => 'Current Password',
    'change_password_new_password' => 'New Password',
    'change_password_re_type_password' => 'Re-type New Password',
    'change_password_password_required' => 'Password is required',
    'change_password_passwords_do_not_match' => 'Passwords do not match.'
];

///////////// Dashboard Translation Line ///////////////////////////
$lang['master_dashboard'] = [
    'start_here' => 'Start Here',
    'recent_applications' => 'Recent Applications',
    'status' => 'Status:',
    'progress' => 'Progress',
    'build_on' => ' Created On',
    'open' => ' Open',
    'link' => 'Link',
    'unlink' => 'Un-Link',
    'cancel' => 'Delete',
    'view_more' => 'View More',
];

///////////// Product Dashboard Translation Line ///////////////////////////
$lang['product_dashboard'] = [
    'how_to_video' => 'How to Video',
    'application_type' => 'APPLICATION TYPE',
    'key_subject_element' => 'KEY SUBJECT ELEMENTS',
    'lodgement_details' => 'LODGEMENT DETAILS',
    'family_unit_tree' => 'FAMILY UNIT TREE',
    'completed' => "Completed",
    'tasks' => "Tasks",
    "date_of_lodgement" => "Date Of Lodgement",
    'trn_number' => "TRN Number",
    'file_number'=> "File Number",
    'due_date'=>'Due Date',
    'add_task' => 'Add Task'
];

///////////// Product Translation Line ///////////////////////////
$lang['product'] = [
    'my_product' => 'My Products',
    'product_name' => 'Product Name',
    'status' => 'Status',
    'completed' => 'Completed',
    'billed_date' => 'Billed Date',
    'unlink' => 'Un-Link',
    'cancel_subscribtion' => 'Cancel Subscribtion',
    'access' => 'Access'
];

///////////// Product Translation Line ///////////////////////////
$lang['folder'] = [
    'folder_name' => 'Folder Name'
];

echo json_encode($lang);exit;
?>
