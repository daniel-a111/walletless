import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TestPassForm from "./TestPassForm";

const MoreActionsMenu = () => {
    let navigate = useNavigate();
    const [subAction, setSubAction] = useState<number|null>();
    const SUB_ACTION_TEST_PASSWORD = 4;
    return <>
        {
            !subAction &&
            <>
                <span
                    onClick={() => navigate(`/app/signin`)}
                    className="main-menu-item">Load account</span>
                <span className="main-menu-item"
                    onClick={() => navigate(`/app/signup`)}
                >Create account</span>
                <span className="main-menu-item"
                    onClick={() => navigate(`/app/manage`)}
                >account settings</span>
                <span className="main-menu-item"
                    onClick={() => setSubAction(SUB_ACTION_TEST_PASSWORD)}
                >Test password</span>
            </>
        }
        {
            subAction === SUB_ACTION_TEST_PASSWORD &&
            <TestPassForm />
        }
    </>;
}
export default MoreActionsMenu;