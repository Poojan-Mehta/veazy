<?php
$lang = array();
///////////// Menu Translation Line ///////////////////////////
$lang['menu'] = [
    'home' => 'Inicio',
    'my_application' => 'Mis aplicaciones',
    'add_application' => 'Agregar aplicación',
    'master_dashboard.profeatures' => 'PRO-FEATURES',
    'all_tasks' => 'Todas las tareas',
    'quick_links' => 'Enlaces rápidos',
    'support' => 'Soporte',
    'myprofile' => 'Mi perfil',
    'logout' => 'Cerrar sesión',
    'product_dashboard' => 'Tablero',
    'product_sidebar_step1' => 'PASO 1 - APRENDER',
    'product_sidebar_step2' => 'PASO 2 - PREPARAR',
    'product_sidebar_step3' => 'PASO 3 - ENVIAR',
    'product_lesson'=> 'Lección',
    'product_soc'=> 'Resumen de criterios',
    'product_dc' => 'Lista de verificación del documento',
    'product_todo' => 'Final To Do',
    'product_coverletter' => 'Carta de presentación',
    'product_faq' => 'Preguntas frecuentes',
    'product.profeatures' => 'PRO-FEATURES',
    'product_tasks' => 'Tareas',
    'product_notes' => 'Notas',
];

///////////// My Profile Translation Line ///////////////////////////
$lang['profile'] = [
    'header' => 'Cuenta',
    'personal_info' => 'Información personal',
    'change_avatar' => 'Cambiar Avatar',
    'change_password' => 'Cambiar contraseña',
    'personal_info_first_name' => 'Nombre',
    'personal_info_first_name_required' => 'Se requiere el nombre',
    'personal_info_last_name' => 'Apellido',
    'personal_info_last_name_required' => 'Se requiere el apellido',
    'personal_info_email' => 'Correo electrónico',
    'personal_info_email_required' => 'Se requiere correo electrónico',
    'personal_info_email_invalid' => 'El correo electrónico no es válido',
    'personal_info_gender' => 'Género',
    'personal_info_gender_required' => 'Género es obligatorio',
    'personal_info_gender_select' => 'Seleccionar género',
    'personal_info_gender_male' => 'Hombre',
    'personal_info_gender_female' => 'Mujer',
    'personal_info_save_btn' => 'Guardar cambios',
    'change_avatar_note' => '¡NOTA!',
    'change_avatar_select_image' => 'Seleccionar imagen',
    'change_avatar_change_image' => 'Cambiar',
    'change_avatar_note_message' => 'Solo formato PNG o JPG y menos de 1 MB.',
    'change_avatar_submit' => 'Enviar',
    'change_password_current_password' => 'Contraseña actual',
    'change_password_new_password' => 'Nueva contraseña',
    'change_password_re_type_password' => 'Volver a escribir la nueva contraseña',
    'change_password_password_required' => 'Se requiere contraseña',
    'change_password_passwords_do_not_match' => 'Las contraseñas no coinciden'
];

///////////// Dashboard Translation Line ///////////////////////////
$lang['master_dashboard'] = [
    'status' => 'Status:',
    'how_to_video' => 'How to Video',
    'completed' => 'Completed',
    'access' => 'Access',
    'unlink' => 'Un-Link',
    'cancel_subscribtion' => 'Cancel Subscribtion',
    'master_task' => 'Master Task',
    'add_task'=> 'Add Task',
    'task' => 'Task',
    'tags' => 'Tags',
    'application' => 'Application',
    'due_date'=> 'Due Date',
    'news' => 'News',
    'veazy_user' => 'Veazy User',
    'goto' => 'Go To'
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

echo json_encode($lang);exit;
?>
