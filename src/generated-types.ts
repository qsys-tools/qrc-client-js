export type QRCRequest = {
    jsonrpc: "2.0";
    method: "NoOp";
    params?: {} | undefined;
} | {
    jsonrpc: "2.0";
    method: "StatusGet";
    params?: {} | undefined;
} | {
    jsonrpc: "2.0";
    method: "Component.GetComponents";
    params?: {} | undefined;
} | {
    jsonrpc: "2.0";
    method: "Logon";
    params: {
        User: string;
        Password: string;
    };
} | {
    jsonrpc: "2.0";
    method: "Control.Get";
    params: string[];
} | {
    jsonrpc: "2.0";
    method: "Control.Set";
    params: {
        Name: string;
        Value: string | boolean | number;
        Ramp?: number | undefined;
    } | {
        Name: string;
        Position: number;
        Ramp?: number | undefined;
    };
} | {
    jsonrpc: "2.0";
    method: "Component.Get";
    params: {
        Name: string;
        Controls: {
            Name: string;
        }[];
    };
} | {
    jsonrpc: "2.0";
    method: "Component.GetControls";
    params: {
        Name: string;
    };
} | {
    jsonrpc: "2.0";
    method: "Component.Set";
    params: {
        Name: string;
        Controls: ({
            Name: string;
            Value: string | boolean | number;
            Ramp?: number | undefined;
        } | {
            Name: string;
            Position: number;
            Ramp?: number | undefined;
        })[];
        ResponseValues?: boolean | undefined;
    };
} | {
    jsonrpc: "2.0";
    method: "ChangeGroup.AddControl";
    params: {
        Id: string;
        Controls: string[];
    };
} | {
    jsonrpc: "2.0";
    method: "ChangeGroup.AddComponentControl";
    params: {
        Id: string;
        Component: {
            Name: string;
            Controls: {
                Name: string;
            }[];
        };
    };
} | {
    jsonrpc: "2.0";
    method: "ChangeGroup.Remove";
    params: {
        Id: string;
        Controls: string[];
    };
} | {
    jsonrpc: "2.0";
    method: "ChangeGroup.Poll";
    params: {
        Id: string;
    };
} | {
    jsonrpc: "2.0";
    method: "ChangeGroup.Destroy";
    params: {
        Id: string;
    };
} | {
    jsonrpc: "2.0";
    method: "ChangeGroup.Invalidate";
    params: {
        Id: string;
    };
} | {
    jsonrpc: "2.0";
    method: "ChangeGroup.Clear";
    params: {
        Id: string;
    };
} | {
    jsonrpc: "2.0";
    method: "ChangeGroup.AutoPoll";
    params: {
        Id: string;
        Rate: number;
    };
} | {
    jsonrpc: "2.0";
    method: "Mixer.SetCrossPointGain";
    params: {
        Name: string;
        Inputs: string;
        Outputs: string;
        Value: number;
        Ramp?: number | undefined;
    };
} | {
    jsonrpc: "2.0";
    method: "Mixer.SetCrossPointDelay";
    params: {
        Name: string;
        Inputs: string;
        Outputs: string;
        Value: number;
        Ramp?: number | undefined;
    };
} | {
    jsonrpc: "2.0";
    method: "Mixer.SetCrossPointMute";
    params: {
        Name: string;
        Inputs: string;
        Outputs: string;
        Value: boolean;
    };
} | {
    jsonrpc: "2.0";
    method: "Mixer.SetCrossPointSolo";
    params: {
        Name: string;
        Inputs: string;
        Outputs: string;
        Value: boolean;
    };
} | {
    jsonrpc: "2.0";
    method: "Mixer.SetInputGain";
    params: {
        Name: string;
        Inputs: string;
        Value: number;
        Ramp?: number | undefined;
    };
} | {
    jsonrpc: "2.0";
    method: "Mixer.SetInputMute";
    params: {
        Name: string;
        Inputs: string;
        Value: boolean;
    };
} | {
    jsonrpc: "2.0";
    method: "Mixer.SetInputSolo";
    params: {
        Name: string;
        Inputs: string;
        Value: boolean;
    };
} | {
    jsonrpc: "2.0";
    method: "Mixer.SetOutputGain";
    params: {
        Name: string;
        Outputs: string;
        Value: number;
        Ramp?: number | undefined;
    };
} | {
    jsonrpc: "2.0";
    method: "Mixer.SetOutputMute";
    params: {
        Name: string;
        Outputs: string;
        Value: boolean;
    };
} | {
    jsonrpc: "2.0";
    method: "Mixer.SetCueMute";
    params: {
        Name: string;
        Cues: string;
        Value: boolean;
    };
} | {
    jsonrpc: "2.0";
    method: "Mixer.SetCueGain";
    params: {
        Name: string;
        Cues: string;
        Value: number;
        Ramp?: number | undefined;
    };
} | {
    jsonrpc: "2.0";
    method: "Mixer.SetInputCueEnable";
    params: {
        Name: string;
        Cues: string;
        Inputs: string;
        Value: boolean;
    };
} | {
    jsonrpc: "2.0";
    method: "Mixer.SetInputCueAfl";
    params: {
        Name: string;
        Cues: string;
        Inputs: string;
        Value: boolean;
    };
} | {
    jsonrpc: "2.0";
    method: "LoopPlayer.Start";
    params: {
        Name: string;
        Log?: boolean | undefined;
        RefId?: string | undefined;
        StartTime?: number | undefined;
        Files: {
            Name: string;
            Output: number;
        }[];
        Loop?: boolean | undefined;
        Seek?: number | undefined;
    };
} | {
    jsonrpc: "2.0";
    method: "LoopPlayer.Stop";
    params: {
        Name: string;
        Log?: boolean | undefined;
        RefId?: string | undefined;
        Outputs: number[];
    };
} | {
    jsonrpc: "2.0";
    method: "LoopPlayer.Cancel";
    params: {
        Name: string;
        Log?: boolean | undefined;
        RefId?: string | undefined;
        Outputs: number[];
    };
} | {
    jsonrpc: "2.0";
    method: "Snapshot.Load";
    params: {
        Name: string;
        Bank: number;
        Ramp?: number | undefined;
    };
} | {
    jsonrpc: "2.0";
    method: "Snapshot.Save";
    params: {
        Name: string;
        Bank: number;
    };
};

export type QrcResultMap = {
    'Logon': true;
    'StatusGet': {
        State: "Idle" | "Active" | "Standby";
        DesignName: string;
        DesignCode: string;
        IsRedundant: boolean;
        IsEmulator: boolean;
        Platform: string;
        Status: {
            Code: number;
            String: string;
        };
    };
    'Control.Get': {
        Name: string;
        String: string;
        Value: string | boolean | number;
        Position: number;
    }[];
    'Control.Set': {
        Name: string;
        String: string;
        Value: string | boolean | number;
        Position: number;
    };
    'Component.Get': {
        Name: string;
        Controls: {
            Name: string;
            String: string;
            Value: string | boolean | number;
            Position: number;
        }[];
    };
    'Component.GetControls': {
        Name: string;
        Controls: {
            Name: string;
            Type: "Float" | "Boolean" | "Array" | "Integer" | "Text" | "Time" | "State Trigger" | "Trigger" | "Virtual" | "Json Vector" | "Priority" | "Status";
            Value: boolean | number;
            ValueMin: number;
            ValueMax: number;
            StringMin: string;
            StringMax: string;
            String: string;
            Position: number;
            Direction: "Read Only" | "Write Only" | "Read/Write";
        }[];
    };
    'Component.Set': true | {
        Component: string;
        Name: string;
        String: string;
        Value: string | boolean | number;
        Position: number;
    }[];
    'Component.GetComponents': {
        ID: string;
        Name: string;
        Type: string;
        Controls: null;
        ControlSource: number;
        Properties: {
            Name: string;
            Value: string;
            PrettyName: string;
        }[];
    }[];
    'ChangeGroup.AddControl': true;
    'ChangeGroup.Remove': true;
    'ChangeGroup.Invalidate': true;
    'ChangeGroup.Clear': true;
    'ChangeGroup.Destroy': true;
    'ChangeGroup.AddComponentControl': true;
    'ChangeGroup.AutoPoll': true;
    'ChangeGroup.Poll': {
        Id: string;
        Changes: ({
            Name: string;
            String: string;
            Value: string | boolean | number;
            Position: number;
        } | {
            Component: string;
            Name: string;
            String: string;
            Value: string | boolean | number;
            Position: number;
        })[];
    };
    'LoopPlayer.Start': undefined;
    'LoopPlayer.Cancel': undefined;
    'LoopPlayer.Stop': undefined;
    'Snapshot.Load': true;
    'Snapshot.Save': true;
};

export type QrcMethod = QRCRequest['method'];
export type QrcParams = QRCRequest['params'];
export type InferQrcRequest<M extends QrcMethod> = Extract<QRCRequest, { method: M }>;
export type InferQrcParams<M extends QrcMethod> = InferQrcRequest<M>['params'];
export type QrcRequestMap = {[M in QrcMethod]: InferQrcRequest<M>};
export type QrcParamMap = {[M in QrcMethod]: InferQrcParams<M>};

