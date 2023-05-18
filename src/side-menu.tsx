import { Accessibility, AddCard, AdminPanelSettings, Check, Close, Login, Logout, Notifications, SettingsAccessibility, SettingsAccessibilityOutlined, ThreeP } from "@mui/icons-material";
import { SideMenuProps } from "./types";
import "./css/side-menu.css";
import * as api from './api'
import { Avatar } from "./elem";
import { useState } from "react";
import { TextField } from "@mui/material";



export default function SideMenu({ open, onClose, avatarUrl, nickName,
    onNotifications, onAccessibilitySettings, onShowLogin, user, isAdmin,
    adminView, setAdminView, notify, setNickName, newNotificationCount }: SideMenuProps) {
    const [showNickEditor, setShowNickEditor] = useState<boolean>(false);
    const [editedNickName, setEditedNickName] = useState<string | undefined>(undefined);

    return <div className="menu-container" style={{ width: open ? 350 : 0 }}>
        <div className="menu-close" onClick={onClose}><Close style={{ fontSize: 40 }} /></div>
        <div className="menu-header-container">
            <Avatar size={100} imageSrc={avatarUrl} />
            <div className="menu-header-name">{nickName}</div>
        </div>
        <div className="menu-all-items">
            <div className="menu-top-items">
                {/* <div className="menu-item-container">
                    <AddCard />
                    <div className="menu-item-caption">{isAdmin ?
                        "יצירת אירוע אישי" :
                        "יצירת אירוע"}</div>
                </div> */}

                <div className="menu-item-container" onClick={onNotifications}>
                    {newNotificationCount > 0 && <div className="notification-badge" style={{right:13, top:9}}>{newNotificationCount}</div>}
                    <Notifications />
                    <div className="menu-item-caption">הודעות ואירועים</div>
                </div>
                {
                    isAdmin && <div className="menu-item-container" onClick={() => setAdminView(!adminView)}>
                        <AdminPanelSettings />
                        <div className="menu-item-caption">תצוגת ניהול</div>
                        <div className="menu-item-3col">{adminView && <Check />}</div>
                    </div>
                }
            </div>
            <div className="menu-bottom-items">
                <div className="menu-item-container" onClick={() => setShowNickEditor(true)}>
                    <ThreeP />
                    <div className="menu-item-caption">בחר כינוי</div>
                </div>
                {
                    showNickEditor && <div className="menu-item-container">
                        <div />
                        <div className="menu-item-caption"><TextField
                            autoFocus
                            label="כינוי"
                            variant="outlined"
                            dir="rtl"
                            value={editedNickName || nickName}
                            onChange={(e: any) => setEditedNickName(e.target.value)}
                        />
                        </div>
                        <div className="menu-item-3col">{editedNickName && nickName !== editedNickName &&
                            <Check onClick={() => {
                                if (editedNickName) {
                                    setNickName(editedNickName);
                                    setShowNickEditor(false);
                                    setEditedNickName(undefined);
                                }
                            }} />}
                            <Close onClick={() => {
                                setShowNickEditor(false);
                                setEditedNickName(undefined);
                            }} />
                        </div>
                    </div>
                }
                <div className="menu-item-container" onClick={onAccessibilitySettings}>
                    <SettingsAccessibilityOutlined />
                    <div className="menu-item-caption">הגדרות נגישות</div>
                </div>
                {user && <div className="menu-item-container" onClick={() => api.logout()}>
                    <Logout />
                    <div className="menu-item-caption">התנתק</div>
                    <div className="menu-item-3col" onClick={(event: any) => {
                        api.testNotif().then(()=>notify.success("בקשה לבדיקת הודעות נקלטה"));
                        event.stopPropagation();
                    }}><Notifications />בדיקה</div>
                </div>}
                {!user && <div className="menu-item-container" onClick={onShowLogin}>
                    <Login />
                    <div className="menu-item-caption">התחבר</div>
                </div>}
            </div>
        </div>
    </div>
}