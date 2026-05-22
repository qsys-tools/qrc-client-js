export type QrcParamMap = {
    'NoOp': {} | undefined;
    'StatusGet': {} | undefined;
    'Component.GetComponents': {} | undefined;
    'Logon': {
        User: string;
        Password: string;
    };
    'Control.Get': string[];
    'Control.Set': {
        Name: string;
        Value: string | boolean | number;
        Ramp?: number | undefined;
    } | {
        Name: string;
        Position: number;
        Ramp?: number | undefined;
    };
    'Component.Get': {
        Name: string;
        Controls: {
            Name: string;
        }[];
    };
    'Component.GetControls': {
        Name: string;
    };
    'Component.Set': {
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
    'ChangeGroup.AddControl': {
        Id: string;
        Controls: string[];
    };
    'ChangeGroup.AddComponentControl': {
        Id: string;
        Component: {
            Name: string;
            Controls: {
                Name: string;
            }[];
        };
    };
    'ChangeGroup.Remove': {
        Id: string;
        Controls: string[];
    };
    'ChangeGroup.Poll': {
        Id: string;
    };
    'ChangeGroup.Destroy': {
        Id: string;
    };
    'ChangeGroup.Invalidate': {
        Id: string;
    };
    'ChangeGroup.Clear': {
        Id: string;
    };
    'ChangeGroup.AutoPoll': {
        Id: string;
        Rate: number;
    };
    'Mixer.SetCrossPointGain': {
        Name: string;
        Inputs: string;
        Outputs: string;
        Value: number;
        Ramp?: number | undefined;
    };
    'Mixer.SetCrossPointDelay': {
        Name: string;
        Inputs: string;
        Outputs: string;
        Value: number;
        Ramp?: number | undefined;
    };
    'Mixer.SetCrossPointMute': {
        Name: string;
        Inputs: string;
        Outputs: string;
        Value: boolean;
    };
    'Mixer.SetCrossPointSolo': {
        Name: string;
        Inputs: string;
        Outputs: string;
        Value: boolean;
    };
    'Mixer.SetInputGain': {
        Name: string;
        Inputs: string;
        Value: number;
        Ramp?: number | undefined;
    };
    'Mixer.SetInputMute': {
        Name: string;
        Inputs: string;
        Value: boolean;
    };
    'Mixer.SetInputSolo': {
        Name: string;
        Inputs: string;
        Value: boolean;
    };
    'Mixer.SetOutputGain': {
        Name: string;
        Outputs: string;
        Value: number;
        Ramp?: number | undefined;
    };
    'Mixer.SetOutputMute': {
        Name: string;
        Outputs: string;
        Value: boolean;
    };
    'Mixer.SetCueMute': {
        Name: string;
        Cues: string;
        Value: boolean;
    };
    'Mixer.SetCueGain': {
        Name: string;
        Cues: string;
        Value: number;
        Ramp?: number | undefined;
    };
    'Mixer.SetInputCueEnable': {
        Name: string;
        Cues: string;
        Inputs: string;
        Value: boolean;
    };
    'Mixer.SetInputCueAfl': {
        Name: string;
        Cues: string;
        Inputs: string;
        Value: boolean;
    };
    'LoopPlayer.Start': {
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
    'LoopPlayer.Stop': {
        Name: string;
        Log?: boolean | undefined;
        RefId?: string | undefined;
        Outputs: number[];
    };
    'LoopPlayer.Cancel': {
        Name: string;
        Log?: boolean | undefined;
        RefId?: string | undefined;
        Outputs: number[];
    };
    'Snapshot.Load': {
        Name: string;
        Bank: number;
        Ramp?: number | undefined;
    };
    'Snapshot.Save': {
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

export type QrcMethod = keyof QrcParamMap;
export type InferQrcParams<M extends QrcMethod> = QrcParamMap[M];
export type InferQrcRequest<M extends QrcMethod> = {
	jsonrpc: '2.0',
	method: M,
	params: InferQrcParams<M>
} | (undefined extends InferQrcParams<M>
	? { jsonrpc: '2.0', method: M }
	: never);
export type QrcRequestMap = {[M in QrcMethod]: InferQrcRequest<M>};
export type InferResponseResult<M extends QrcMethod> = M extends keyof QrcResultMap ? QrcResultMap[M] : unknown;

